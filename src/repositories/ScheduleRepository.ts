// getSchedules
import { Request } from "express";
import { Schedule, ScheduleSchema, Semester, StudentInfo } from '../config/zod-schema.js';
import { db } from "../config/db.js";
import { coursePrerequisites, courses, majors, minors, schedules, semesterCourses, semesters, studentInfo, users } from "../config/schema.js";
import { asc, eq } from "drizzle-orm";
import { NewScheduleRequest } from "../types/requests/NewScheduleRequest.js";
import { PgColumn, PgTable } from "drizzle-orm/pg-core";

export const getSchedules = async (userid: number): Promise<Schedule[]> => {

    try {

        const result = await db.select({
            scheduleId:      schedules.id,
            scheduleName:    schedules.scheduleName,
            major:           majors,
            minor:           minors,
            studentInfo:     studentInfo,
            semester:        semesters,
            courses:         courses,
            prerequisiteId: coursePrerequisites.prerequisiteId
        })
        .from(schedules)
        .innerJoin(studentInfo, eq(studentInfo.id, schedules.studentInfoId))
        .innerJoin(semesters, eq(semesters.scheduleId, schedules.id))
        .innerJoin(majors, eq(majors.id, studentInfo.majorId))
        .leftJoin(minors, eq(minors.id,  studentInfo.minorId))
        .innerJoin(semesterCourses, eq(semesterCourses.semesterId, semesters.id))
        .innerJoin(courses, eq(courses.id, semesterCourses.courseId))
        .leftJoin(coursePrerequisites, eq(coursePrerequisites.courseId, courses.id))
        // need a left join for prereqs because even if a course doesnt have a prereq, we want it to show up
        .where(eq(schedules.userId, userid))
        .orderBy(asc(semesters.index));

        console.log("Result from DB", result);

        const scheduleMap = new Map();

        result.forEach((r) => {

            if (scheduleMap.get(r.scheduleId) === undefined) {

                scheduleMap.set(r.scheduleId, {
                    name: r.scheduleName,
                    studentInfo: {
                        major: r.major,
                        minor: r.minor,
                        graduationYear: r.studentInfo.gradYear,
                        program: r.studentInfo.program, // undergraduate, masters
                        interests: r.studentInfo.interests
                    },
                    semesters: new Map()
                });

            }

            let semesterMap = scheduleMap.get(r.scheduleId).semesters as Map<number, any>;
            
            if (semesterMap.get(r.semester.id) === undefined) {
                semesterMap.set(r.semester.id, {
                    name: r.semester.name,
                    index: r.semester.index,
                    courses: new Map()
                });
            }

            let coursesMap = semesterMap.get(r.semester.id).courses;

            if (coursesMap.get(r.courses.id) === undefined) {
                coursesMap.set(r.courses.id, {
                    ...r.courses,
                    prerequisites: []
                });
            }

            if (r.prerequisiteId != null) {
                coursesMap.get(r.courses.id).prerequisites.push(r.prerequisiteId);
            }

        });

        const userSchedules: Schedule[] = [...scheduleMap.values()].map((schedule) => ({
            ...schedule,
            semesters: ([...schedule.semesters.values()] as Semester[])
                .map((semester) => ({
                    ...semester,
                    courses: [...semester.courses.values()]
            }))
        }));

        console.log("Found schedules:", userSchedules);

        return userSchedules;

    } catch(e) {
        console.error(e);
        return [];
    }
}

export const saveNewSchedule = async (newSchedule: Schedule, userid: number | undefined): Promise<boolean> => {

    try {

        if (userid === undefined) {
            throw new Error("User ID is missing. Cannot save.");
        }

        console.log("Schedule to save, ", newSchedule);

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

        return true;

    } catch(e) {
        
        return false;
    }

}
