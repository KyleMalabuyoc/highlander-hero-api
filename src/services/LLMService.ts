import { zodResponseFormat } from 'openai/helpers/zod.mjs';
import { openai } from '../config/openai.js';
import { scheduleCreationSystemPrompt, scheduleEditSystemPrompt } from '../utils/prompts.js';
import { EditScheduleLLMResponseSchema, ScheduleLLMResponse, ScheduleLLMResponseSchema, ScheduleSchema, Suggestion } from '../config/zod-schema.js';
import { Course } from '../types/Course.js';
import * as academicRepository from "../repositories/AcademicsRepository.js";
import { Semester } from '../types/Semester.js';
import { Schedule } from '../types/Schedule.js';
import { QueryResponse, RecordMetadata } from '@pinecone-database/pinecone';
import * as pineconeService from './PineconeService.js';
import redis from '../config/redis.js';
import { NewScheduleRequest } from '../types/requests/Requests.js';
import { formatMsg, logger } from '../config/logger/pino.js';
import { LLM_SERVICE, LLM_METHODS } from '../types/Logging.js';

type RequiredCourse = Awaited<ReturnType<typeof academicRepository.getMajorRequiredCourses>>[number];

export const createSchedule = async (newScheduleRequest: NewScheduleRequest) => {

     try {

        const requiredCoursesForMajor = await academicRepository.getMajorRequiredCourses(newScheduleRequest.studentInfo.major.id);

        logger.info({ ...formatMsg(LLM_SERVICE, LLM_METHODS.CREATE_SCHEDULE), majorId: newScheduleRequest.studentInfo.major.id }, "Grabbed required courses for major.");

        let semesterMap: Map<number, { semesterIndex: number, courses: Course[] }> = new Map();
        
        // this loop builds a default schedule structure for the major without LLM
        requiredCoursesForMajor.forEach((c) => {

            if (c.yearIndex !== null && c.semesterIndex !== null) {

                const mapID = c.yearIndex * 10 + c.semesterIndex;
                
                if (semesterMap.get(mapID) === undefined) {
                    // use rest destructuring fir course
                    const { yearIndex, semesterIndex, ...course } = c;
                    semesterMap.set(mapID, { semesterIndex: c.semesterIndex, courses: [course] });
                } else {
                    const currMapValue = semesterMap.get(mapID)?.courses ?? [];
                    const { yearIndex, semesterIndex, ...course} = c;
                    semesterMap.set(mapID, { semesterIndex: semesterIndex, courses: [...currMapValue, course] });
                }

            }

        });

        // create semesters array - semesterMap.entries() gives us an array of tuples.
        const semesters: Semester[] = Array.from(semesterMap.entries()).sort((a, b) => {
            return a[0] - b[0];
        }).map(([key, semester]) => {
            return {
                name: '',
                yearIndex: (key - semester.semesterIndex) / 10,
                index: semester.semesterIndex,
                courses: semester.courses
            }
        });

        let defaultSchedule = {
            id: 0,
            name: newScheduleRequest.scheduleName,
            semesters: semesters,
            studentInfo: newScheduleRequest.studentInfo
        };

        // grabbing entire course list from pinecone metadata
        const pineconeResults = await pineconeService.pineconeQueryForScheduleCreation(newScheduleRequest.studentInfo);
        const schedule = await scheduleEnrichment(newScheduleRequest, defaultSchedule, pineconeResults);

        return schedule;

    } catch(e) {
        logger.error({ ...formatMsg(LLM_SERVICE, LLM_METHODS.CREATE_SCHEDULE), err: e }, 'Schedule creation error.');
        return {} as Schedule;
    }

}

export const editSchedule = async (schedule: Schedule, semesterIndex: number, query: string) => {

    try {

        // Build a flat list of every course already in the schedule for explicit prompt injection + post-filter
        const allCourseNames: string[] = [];
        for (const semester of schedule.semesters) {
            for (const course of semester.courses) {
                // allCourseIds.add(course.id);
                allCourseNames.push(`${course.name}`);
            }
        }
        // const existingCoursesBlock = allCourseNames.join('\n');

        // pinecone DB call -> pass query
        // in thr query, pass the students major and minor if applciable??
        const pineconeMetadataText = (await pineconeService.simplePineconeCall(query, 3)).matches.map((m) => m.metadata?.text);

        logger.debug({ ...formatMsg(LLM_SERVICE, LLM_METHODS.EDIT_SCHEDULE), pineconeMetadataText }, 'Pinecone results.');

        const response = await openai.chat.completions.create({
            model: "gpt-4o-2024-08-06",
            messages: [
                { role: "system", content: scheduleEditSystemPrompt },
                { role: "user", content: `

                    Behavior: Respond as a knowledgeable academic advisor. NEVER mention Pinecone, databases, APIs, embeddings, or any technical implementation detail — the student should never be aware of how this works internally. 
                    Rules:
                        1. Do NOT suggest courses that are already within the students full current schedule.

                    ## Student Request
                    ${ query }

                    ## Semester Being Edited
                    ${ JSON.stringify(schedule.semesters[semesterIndex], null, 2) }

                    ## Student Full Current Schedule
                    ${ JSON.stringify(schedule, null, 2) }

                    ## Pinecone Text
                    ${ pineconeMetadataText }
                `
                }
            ],
            temperature: 0,
            response_format: zodResponseFormat(EditScheduleLLMResponseSchema, "suggestions")
        });

        const scheduleResponseFromLLM = JSON.parse(response.choices[0].message.content ?? "{}");

        logger.debug({ ...formatMsg(LLM_SERVICE, LLM_METHODS.EDIT_SCHEDULE), scheduleResponseFromLLM }, 'LLM edit response.');

        // only need to make cache or DB call if suggestions is populated.
        if (scheduleResponseFromLLM.suggestions.length > 0) {

            // check if cache has courses available
            const courses = await redis.get<Course[]>(`courses:all`);
            const coursesMap = new Map<string, Course>(courses?.map((c) => [c.name, c]));
            const updatedSuggestions = scheduleResponseFromLLM.suggestions.map((s: Suggestion) => ({
                ...s,
                originalCourse: s.originalCourse !== null ? coursesMap.get(s.originalCourse.name) : null,
                proposedCourse: s.proposedCourse !== null ? coursesMap.get(s.proposedCourse.name) : null
            }));
            const finalSchedule = {
                ...scheduleResponseFromLLM,
                suggestions: updatedSuggestions
            };
            return finalSchedule;
        //     // for now - we assume courses in cache always available since we call it on login with 24hr expiry
        //     // if we run into issues where courses in cache isnt available for some reason we'll query DB directly
        }

        return scheduleResponseFromLLM;

    } catch(e) {
        // need to return an error response TODO
        logger.error({ ...formatMsg(LLM_SERVICE, LLM_METHODS.EDIT_SCHEDULE), err: e }, 'Schedule edit error.');
    }

}

const scheduleEnrichment = async (newScheduleRequest: NewScheduleRequest, 
    defaultSchedule: Schedule, pineconeResults: QueryResponse<RecordMetadata>[]) => {

    const currentYear = new Date().getFullYear();

    try {

        const slimSchedule = {
            semesters: defaultSchedule.semesters.map(s => ({
                index: s.index,
                yearIndex: s.yearIndex,
                courses: s.courses.map(c => ({ name: c.name, credits: c.credits, type: c.type, prerequisites: c.prerequisites.map((p) => p.name) }))
            }))
        };

        const [majorPineconeMetadata, minorPineconeMetadata] = pineconeResults;
        const majorPineconeCourseNames = majorPineconeMetadata.matches[0].metadata?.course_names as string[];
        const minorPineconeCourseNames = minorPineconeMetadata ? minorPineconeMetadata.matches[0].metadata?.course_names as string[] : [];

        // TODO: hit cache instead
        const consolidateCourses = (await academicRepository.getCourseByColumn([...majorPineconeCourseNames, ...minorPineconeCourseNames] as string[], "name"));
        const courseMap = new Map<string, Course>(consolidateCourses.map((c) => ([c.name, c])));

        logger.debug({ ...formatMsg(LLM_SERVICE, LLM_METHODS.CREATE_SCHEDULE), count: consolidateCourses.length }, 'Required courses fetched.');
        logger.debug({ ...formatMsg(LLM_SERVICE, LLM_METHODS.CREATE_SCHEDULE), context: majorPineconeMetadata.matches.map(m => m.metadata?.text) }, 'Pinecone major context.');
        logger.debug({ ...formatMsg(LLM_SERVICE, LLM_METHODS.CREATE_SCHEDULE), context: minorPineconeMetadata?.matches.map(m => m.metadata?.text) }, 'Pinecone minor context.');

        const hasMinor = !!newScheduleRequest.studentInfo.minor;

        // .responses => newer chat completions API
        const buildScheduleLLMResponse = await openai.chat.completions.create({
            model: "gpt-4o-2024-08-06",
            messages: [
                { role: "system", content: scheduleCreationSystemPrompt },
                { role: "user", content: `

                    Major: ${ newScheduleRequest.studentInfo.major.name }
                    ${ hasMinor ? `Minor: ${ newScheduleRequest.studentInfo.minor!.name }` : '' }
                    Interests: ${ newScheduleRequest.studentInfo.interests && newScheduleRequest.studentInfo.interests.length > 0 ?
                        newScheduleRequest.studentInfo.interests.join(',') : 'none'
                    }
                    Graduation Year: ${ newScheduleRequest.studentInfo.graduationYear }

                    ## Current Year
                    ${ currentYear }

                    ## Schedule Name
                    ${ newScheduleRequest.scheduleName }

                    ## Pinecone Results for Major
                    ${ JSON.stringify(majorPineconeMetadata.matches.map(m => m.metadata?.text)) }

                    ${ hasMinor ? `## Pinecone Results for Minor\n${ JSON.stringify(minorPineconeMetadata!.matches.map(m => m.metadata?.text)) }` : '' }

                    ## Current Schedule
                    ${ JSON.stringify(slimSchedule) }

                    ## All Major Courses
                    ${ JSON.stringify(majorPineconeCourseNames) }

                    ${ hasMinor ? `## All Minor Courses\n${ JSON.stringify(minorPineconeCourseNames) }` : '' }

                `
                }
            ],
            temperature: 0, // ??
            response_format: zodResponseFormat(ScheduleLLMResponseSchema, "schedule") // using zod for schema builder
        });

        // add disclaimer: This schedule is a general guide and should be tailored to meet individual needs and academic goals. Always consult with an academic advisor to ensure all degree requirements are met.
        const scheduleResponseFromLLM: ScheduleLLMResponse = JSON.parse(buildScheduleLLMResponse.choices[0].message.content ?? "{}");

        logger.info({ ...formatMsg(LLM_SERVICE, LLM_METHODS.CREATE_SCHEDULE), semesterCount: scheduleResponseFromLLM.semesters.length }, 'Schedule built from LLM response.');

        // need to manually add student info. we dont need to send it the studentInfo, thast already provided in the user query.
        const schedule: Schedule = {
            id: 0,
            ...scheduleResponseFromLLM,
            semesters: scheduleResponseFromLLM.semesters.map((s, idx) => ({
                ...s,
                index: idx,
                courses: s.courses.map(c => courseMap.get(c.name) ?? {} as Course) ?? []
            })),
            studentInfo: newScheduleRequest.studentInfo
        };

        return schedule;

    } catch(e) {
        logger.error({ ...formatMsg(LLM_SERVICE, LLM_METHODS.CREATE_SCHEDULE), err: e }, 'Schedule enrichment error.');
        return {} as Schedule;
    }
    

}