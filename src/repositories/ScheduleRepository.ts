// getSchedules
import { Request } from "express";
// import { Schedule } from '../config/zod-schema.js';
import { db } from "../config/db.js";
import { coursePrerequisites, courses, majors, minors, schedules, semesterCourses, semesters, studentInfo, users } from "../config/schema.js";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { Schedule } from "../types/Schedule.js";
import { UpdateScheduleRequest } from "../types/requests/Requests.js";

export const getSchedules = async (userid: number): Promise<Schedule[]> => {

    try {

        // so we dont get confused when we join courses table for prereqs
        const prereqCourses = alias(courses, 'prereq_courses');

        const result = await db.select({
            scheduleId:         schedules.id,
            scheduleName:       schedules.scheduleName,
            majorId:            majors.id,
            majorName:          majors.name,
            majorDescription:   majors.description,
            majorReqCreds:      majors.reqCreds,
            minorId:            minors.id,
            minorName:          minors.name,
            minorDescription:   minors.description,
            minorReqCreds:      minors.reqCreds,
            gradYear:           studentInfo.gradYear,
            program:            studentInfo.program,
            interests:          studentInfo.interests,
            semesterId:         semesters.id,
            semesterName:       semesters.name,
            semesterIndex:      semesters.index,
            courseId:           courses.id,
            courseName:         courses.name,
            courseCode:         courses.code,
            courseDescription:  courses.description,
            courseCredits:      courses.credits,
            courseStatus:       courses.status,
            courseType:         courses.type,
            courseJobRelevancy: courses.jobRelevancy,
            prerequisites:      sql<number[]>`array_agg(${prereqCourses.id}) filter (where ${prereqCourses.id} is not null)`
        })
        .from(schedules)
        .innerJoin(studentInfo, eq(studentInfo.id, schedules.studentInfoId))
        .innerJoin(majors, eq(majors.id, studentInfo.majorId))
        .leftJoin(minors, eq(minors.id, studentInfo.minorId))
        .innerJoin(semesters, eq(semesters.scheduleId, schedules.id))
        .innerJoin(semesterCourses, eq(semesterCourses.semesterId, semesters.id))
        .innerJoin(courses, eq(courses.id, semesterCourses.courseId))
        .leftJoin(coursePrerequisites, eq(coursePrerequisites.courseId, courses.id))
        .leftJoin(prereqCourses, eq(prereqCourses.id, coursePrerequisites.prerequisiteId))
        .where(eq(schedules.userId, userid))
        .groupBy(
            schedules.id, schedules.scheduleName,
            majors.id, majors.name, majors.description, majors.reqCreds,
            minors.id, minors.name, minors.description, minors.reqCreds,
            studentInfo.gradYear, studentInfo.program, studentInfo.interests,
            semesters.id, semesters.name, semesters.index,
            courses.id, courses.name, courses.code, courses.description,
            courses.credits, courses.status, courses.type, courses.jobRelevancy
        )
        .orderBy(asc(semesters.index));

        // console.log("Result from DB", result);

        const scheduleMap = new Map();

        result.forEach((r) => {

            if (!scheduleMap.has(r.scheduleId)) {
                scheduleMap.set(r.scheduleId, {
                    name: r.scheduleName,
                    studentInfo: {
                        major: { id: r.majorId, name: r.majorName, description: r.majorDescription, reqCreds: r.majorReqCreds },
                        minor: r.minorId ? { id: r.minorId, name: r.minorName!, description: r.minorDescription!, reqCreds: r.minorReqCreds! } : null,
                        graduationYear: r.gradYear,
                        program: r.program,
                        interests: r.interests ? r.interests.split(',').filter(Boolean) : null
                    },
                    semesters: new Map()
                });
            }

            const semesterMap = scheduleMap.get(r.scheduleId).semesters;

            if (!semesterMap.has(r.semesterId)) {
                semesterMap.set(r.semesterId, {
                    id: r.semesterId,
                    name: r.semesterName,
                    index: r.semesterIndex,
                    courses: []
                });
            }

            semesterMap.get(r.semesterId).courses.push({
                id: r.courseId,
                name: r.courseName,
                code: r.courseCode,
                description: r.courseDescription,
                credits: r.courseCredits,
                status: r.courseStatus,
                type: r.courseType,
                jobRelevancy: r.courseJobRelevancy,
                prerequisites: r.prerequisites ?? []
            });

        });

        const userSchedules: Schedule[] = [...scheduleMap.values()].map((schedule) => ({
            ...schedule,
            semesters: [...schedule.semesters.values()]
        }));

        return userSchedules;

    } catch(e) {
        console.error(e);
        return [];
    }
}

export const saveNewSchedule = async (newSchedule: Schedule, userid: number | undefined): Promise<number> => {

    try {

        let scheduleID = 0;

        if (userid === undefined) {
            throw new Error("User ID is missing. Cannot save.");
        }

        // grab major id and minor id, and then store student info -> returns studentinfo id of the row we just inserted
        // store the schedule with the userid, and the studentinfo id, return schedule id
        // store semesters with schedule id tied to each semester, return semester id
        // link courses with the semester id you just created. JOIN table now has course id tied to semester id

        // TODO: need a better approach for empty columns, stop defaulting to 0

        // wrap in a transaction, so if one step fails, the whole thing fails
        await db.transaction(async (tx) => {

            const [ studentInfoEntry ] = await tx.insert(studentInfo).values({ 
                majorId: newSchedule.studentInfo.major.id,
                minorId: newSchedule.studentInfo.minor?.id ?? null, 
                gradYear: newSchedule.studentInfo.graduationYear,
                program: newSchedule.studentInfo.program,
                interests: newSchedule.studentInfo.interests?.join(",") ?? ""
            }).returning();

            // now we have the student info id that we just stored, use it to tie FK for the schedule

            const [ scheduleEntry ] = await tx.insert(schedules).values({
                userId: userid,
                scheduleName: newSchedule.name,
                totalCredits: 0, // NEED TO FIX THIS
                studentInfoId: studentInfoEntry.id
            }).returning();

            scheduleID = scheduleEntry.id;

            // we just inserted the schedule - we now have the id. time to start storing semesters
            /// loop through all of the semesters, storing erach one one by one
            for (const semester of newSchedule.semesters) {

                const [semesterEntry] = await tx.insert(semesters).values({
                    scheduleId: scheduleEntry.id,
                    name: semester.name,
                    index: semester.index
                }).returning();

                // need another loop to go torugh all classes that are tied to the semester we are working on
                for (const course of semester.courses) {
                    await tx.insert(semesterCourses).values({
                        semesterId: semesterEntry.id,
                        courseId: course.id
                    });
                }
            }
        }).catch((err) => {
            console.error(err);
        });

        return scheduleID;

    } catch(e) {
        
        return -1;
    }

}

export const updateSchedule = async (request: UpdateScheduleRequest) => {

    try {

        const { semesterId, originalCourseIds, updatedCourseIds } = request;

        // grab courses that are no longer in the updated arr that were in the original arr
        const deleteCourses = originalCourseIds.filter((c) => !updatedCourseIds.includes(c));

        // grab the courses that are now in the updated arr but were not in the original arr
        const addCourses = updatedCourseIds.filter((c) => !originalCourseIds.includes(c));

        // transactional delete / insert

        // wrap in a transaction, so if one step fails, the whole thing fails
        await db.transaction(async (tx) => {

            await tx.delete(semesterCourses).where(
                and(
                    eq(semesterCourses.semesterId, semesterId), inArray(semesterCourses.courseId, deleteCourses)
                )
            );

            await tx.insert(semesterCourses).values(addCourses.map((c) => ({ semesterId: semesterId, courseId: c })));

        }).catch((err) => {
            console.error(err);

            return false;
        });

        return true;

    } catch(e) {

        console.error(e);

        return false;

    }

}
