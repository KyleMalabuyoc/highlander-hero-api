import { eq, inArray, sql } from "drizzle-orm";
import { db } from "../config/db.js";
import { coursePrerequisites, courses, majorRequirements, majors, minors } from "../config/schema.js";
import { Course } from "../types/Course.js";

export const getCourses = async () => {

    const rows = await db.select({
        course: courses,
        prerequisites: sql<number[]>`array_agg(${coursePrerequisites.prerequisiteId}) filter (where ${coursePrerequisites.prerequisiteId} is not null)`
    })
    .from(courses)
    .leftJoin(coursePrerequisites, eq(coursePrerequisites.courseId, courses.id))
    .groupBy(courses.id, courses.name, courses.code, courses.description, courses.credits, courses.status, courses.type, courses.jobRelevancy);

    return rows.map((r) => ({
        ...r.course,
        prerequisites: r.prerequisites ?? []
    }));

}

export const getMajors = () => {
    return db.select().from(majors);
}

export const getMinors = () => {
    return db.select().from(minors);
}

export const getMajorRequiredCourses = async (majorId: number) => {

    // TODO: some issues with year index and semester index - LLM might have trouble allowing students
    // to move courses around. Tighlty bound to whatever the schedule template is due to context
    // also need to incorporate this year idnex and semester index with minors and interests
    // also how does it work when switching courses? transfers??


    try {

        // grabs all rows (courses along with an array of prereq ids)
        const rows = await db.select({
            course: courses,
            yearIndex: majorRequirements.yearIndex,
            semesterIndex: majorRequirements.semesterIndex,
            prereqIds: sql<number[]>`array_agg(${coursePrerequisites.prerequisiteId}) filter (where ${coursePrerequisites.prerequisiteId} is not null)`
        })
        .from(majorRequirements)
        .innerJoin(courses, eq(majorRequirements.courseId, courses.id))
        .leftJoin(coursePrerequisites, eq(coursePrerequisites.courseId, courses.id))
        .where(eq(majorRequirements.majorId, majorId))
        .groupBy(courses.id, courses.name, courses.code, courses.description, courses.credits, courses.status, courses.type, courses.jobRelevancy, majorRequirements.yearIndex, majorRequirements.semesterIndex);

        // need to flatten because rows are returned as such
        /**
         * 
         * rows = [
            { course: { id: 1, ... }, prereqIds: [2, 3] },   // course 1's prereqs
            { course: { id: 4, ... }, prereqIds: [2, 5] },   // course 4's prereqs
            { course: { id: 6, ... }, prereqIds: null },      // course 6 has no prereqs
            ]
            rows.map(r => r.prereqIds ?? [])     // → [[2, 3], [2, 5], []]  ← still nested
            rows.flatMap(r => r.prereqIds ?? []) // → [2, 3, 2, 5]          ← flat

         * this line grabs all unique pre req ids that weve gathered
         */
        const allPrereqIds = [...new Set(rows.flatMap(r => r.prereqIds ?? []))];

        const prereqMap = new Map<number, typeof courses.$inferSelect>();
        if (allPrereqIds.length > 0) {
            const prereqCourses = await db.select().from(courses).where(inArray(courses.id, allPrereqIds));
            for (const c of prereqCourses) prereqMap.set(c.id, c);
        }

        // map course and then iterate through prereq array to build pre req course arr
        return rows.map(r => ({
            ...r.course,
            yearIndex: r.yearIndex,
            semesterIndex: r.semesterIndex,
            prerequisites: (r.prereqIds ?? []).map(id => prereqMap.get(id)).filter(Boolean) as Course[]
        }));

    } catch(e) {
        console.error(e);
        return [];
    }

}

export const getMinorRequirements = (minorId: number) => {


}

export const getCourseByColumn = async (value: string[] | number[], columnName: keyof typeof courses) => {
    const column = courses[columnName];

    const rows = await db.select({
        course: courses,
        prereqIds: sql<number[]>`array_agg(${coursePrerequisites.prerequisiteId}) filter (where ${coursePrerequisites.prerequisiteId} is not null)`
    })
    .from(courses)
    .leftJoin(coursePrerequisites, eq(coursePrerequisites.courseId, courses.id))
    .where(inArray(column as any, value as any[]))
    .groupBy(courses.id, courses.name, courses.code, courses.description, courses.credits, courses.status, courses.type, courses.jobRelevancy);

    const allPrereqIds = [...new Set(rows.flatMap(r => r.prereqIds ?? []))];

    const prereqMap = new Map<number, typeof courses.$inferSelect>();
    if (allPrereqIds.length > 0) {
        const prereqCourses = await db.select().from(courses).where(inArray(courses.id, allPrereqIds));
        for (const c of prereqCourses) prereqMap.set(c.id, c);
    }

    return rows.map(r => ({
        ...r.course,
        prerequisites: (r.prereqIds ?? []).map(id => prereqMap.get(id)).filter(Boolean) as Course[]
    }));
}