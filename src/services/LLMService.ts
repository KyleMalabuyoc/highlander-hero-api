import { zodResponseFormat } from 'openai/helpers/zod.mjs';
import { openai } from '../config/openai.js';
import { pinecone_index } from '../config/pinecone.js';
import { NewScheduleRequest } from '../types/requests/NewScheduleRequest.js';
import { StudentInfo } from '../types/StudentInfo.js';
import { scheduleCreationSystemPrompt, scheduleEditSystemPrompt } from '../utils/prompts.js';
import { EditScheduleLLMResponse, EditScheduleLLMResponseSchema, Schedule, ScheduleLLMResponse, ScheduleLLMResponseSchema, ScheduleSchema } from '../config/zod-schema.js';
import { studentInfo } from '../config/schema.js';
import * as academicService from './AcademicsService.js';

export const createSchedule = async (newScheduleRequest: NewScheduleRequest): Promise<Schedule> => {

    // embed our requests in order for pinecone to understand
    // send our query to pinecone
    // store pinecone context
    // feed pinecone context as a part of the open ai api call

    console.log("Query for pinecone before embedding: ", formatForPineconeBeforeEmbedding(newScheduleRequest.studentInfo));

    // embed
    // const embedding = await openai.embeddings.create({
    //     model: "text-embedding-3-small",
    //     input: formatForPineconeBeforeEmbedding(newScheduleRequest.studentInfo),
    //     encoding_format: "float",
    // });

    // const queryVector = embedding.data[0].embedding;

    // maybe some calculatred top K depending on query coming in. for concise queries without a lot of
    // ambiguity, only get top 3, but for othgers, higher amount of results

    // pinecone for augmentation
    // const results = await pinecone_index.query({
    //     vector: queryVector,
    //     topK: 10,
    //     includeMetadata: true
    // });

    // construct context object 
    // pass it along to openAI call

    // const relative_context = results.matches.map((m) => { return { parent: m.id, metadata: m.metadata }});

    // more context
    const courseCatalog = (await academicService.getCourses()).data;
    const currentYear = new Date().getFullYear();

// Course Catalog: ${ JSON.stringify(courseCatalog) }

    // .responses => newer chat completions API
    const response = await openai.chat.completions.create({
        model: "gpt-4o-2024-08-06", // model recommended by Claude for this task
        messages: [
            { role: "system", content: scheduleCreationSystemPrompt },
            { role: "user", content: `
                User Query: ${ formatForPineconeBeforeEmbedding(newScheduleRequest.studentInfo) }
                Current Year: ${currentYear}
                Schedule Name: ${ newScheduleRequest.scheduleName }
                Generate me a full degree schedule based off of the user query and the instructions I have given you.
                Use the schedule name provided.
            `
            }
        ],
        temperature: 0, // ??
        response_format: zodResponseFormat(ScheduleLLMResponseSchema, "schedule") // using zod for schema builder
    });

    // Relative Context: ${JSON.stringify(relative_context)}. data coming from RAG pipeline is no good.
    // its actually polluting the response.

    // add disclaimer: This schedule is a general guide and should be tailored to meet individual needs and academic goals. Always consult with an academic advisor to ensure all degree requirements are met.
    const scheduleResponseFromLLM = JSON.parse(response.choices[0].message.content ?? "{}") as ScheduleLLMResponse;

    // need to manually add student info. we dont need to send it the studentInfo, thast already provided in the user query.
    const schedule = { ...scheduleResponseFromLLM, studentInfo: newScheduleRequest.studentInfo };

    return schedule;
}

export const editSchedule = async (schedule: Schedule, semesterIndex: number, query: string) => {

    // Build a flat list of every course already in the schedule for explicit prompt injection + post-filter
    const allCourseIds = new Set<number>();
    const allCourseNames: string[] = [];
    for (const semester of schedule.semesters) {
        for (const course of semester.courses) {
            allCourseIds.add(course.id);
            allCourseNames.push(`- ${course.name} (id: ${course.id})`);
        }
    }
    const existingCoursesBlock = allCourseNames.join('\n');

    const response = await openai.chat.completions.create({
        model: "gpt-4o-2024-08-06",
        messages: [
            { role: "system", content: scheduleEditSystemPrompt },
            { role: "user", content: `
                ## Student Request
                ${query}

                ## Semester Being Edited
                ${JSON.stringify(schedule.semesters[semesterIndex], null, 2)}

                ## ALL Courses Already In The Schedule (DO NOT propose any of these)
                ${existingCoursesBlock}

                ## Full Schedule (for context)
                ${JSON.stringify(schedule, null, 2)}

                Edit the semester based on the student's request. Follow all rules in the system prompt.
                IMPORTANT: Every course listed under "ALL Courses Already In The Schedule" is off-limits as a proposed course. If no valid swap exists, explain why in \`content\` and return an empty \`suggestions\` array.
            `
            }
        ],
        temperature: 0,
        response_format: zodResponseFormat(EditScheduleLLMResponseSchema, "suggestions")
    });

    const scheduleResponseFromLLM = JSON.parse(response.choices[0].message.content ?? "{}") as EditScheduleLLMResponse;

    // // Safety net: strip any suggestions where the proposed course is already in the schedule
    // scheduleResponseFromLLM.suggestions = scheduleResponseFromLLM.suggestions.filter(
    //     (s) => s.proposedCourse === null || !allCourseIds.has(s.proposedCourse.id)
    // );

    console.log("Edit response", scheduleResponseFromLLM);
    return scheduleResponseFromLLM;
}

const formatForPineconeBeforeEmbedding = (req: StudentInfo) => {
    const { major, minor, graduationYear, interests, program } = req;
    const parts = [`I am a ${program} student studying ${major?.name}. Graduating in ${graduationYear}.`];
    if (minor?.name) parts.push(`Minor in ${minor.name}.`);
    if (interests?.length) parts.push(`Interests: ${interests.join(", ")}.`);
    return parts.join(" ");
}