import { eq } from "drizzle-orm";
import { db } from "../config/db.js";
import redis from "../config/redis.js";
import { coursePrerequisites, courses, majors, minors } from "../config/schema.js";
import { Major, Minor } from "../types/AcademicProgram.js";
import { Course } from "../types/Course.js";
import { ResponseEntity } from "../types/ResponseEntity.js";
import * as academicRepository from "../repositories/AcademicsRepository.js";

export const getCourses = async (): Promise<ResponseEntity> => {

    try {

        // typing so upstash knows what to deserialize to. even without it, it deserializes
        const cache = await redis.get<Course[]>(`courses:all`);

        if (cache !== null) { // hit
            return new ResponseEntity(200, cache);
        }

    } catch(err) {
        console.error(err);
    }
    
    // cache not available
    try {

        const res = await academicRepository.getCourses();
        const coursesMap = new Map();

        res.forEach((r) => {

            if (coursesMap.get(r.courses.id) === undefined) {
                coursesMap.set(r.courses.id, { ...r.courses, prerequisites: [] }) 
            }

            let cmPrereqs = coursesMap.get(r.courses.id)?.prerequisites;
            cmPrereqs?.push(r.course_prerequisites.prerequisiteId);
        });

        const allCourses = Array.from(coursesMap.values());
        await redis.set(`courses:all`, JSON.stringify(allCourses),  { ex: Number(process.env.UPSTASH_REDIS_EXPIRY) });
        return new ResponseEntity(200, allCourses);

    } catch(err) {

        if (err instanceof Error) {
            return { status: 500, errorMessage: err.message };
        }

        return { status: 500, errorMessage: "Internal Server Error" };
    }
}

export const getMajors = async (): Promise<ResponseEntity> => {

    try {

        const cache = await redis.get<Major[]>(`majors:all`);

        if (cache !== null) {
            return new ResponseEntity(200, cache);
        }

    } catch(err) {
        console.error(err);
    }

    try {

        const res = await academicRepository.getMajors();
        await redis.set(`majors:all`, JSON.stringify(res), { ex: Number(process.env.UPSTASH_REDIS_EXPIRY) });
        return new ResponseEntity(200, res);

    } catch(err) {
        if (err instanceof Error) {
            return { status: 500, errorMessage: err.message };
        }
        return { status: 500, errorMessage: "Internal Server Error" };
    }
}

export const getMinors = async (): Promise<ResponseEntity> => {

    try {

        const cache = await redis.get<Minor[]>(`minors:all`);

        if (cache !== null) {
            return new ResponseEntity(200, cache);
        }

    } catch(err) {
        console.error(err);
    }

    try {

        const res = await academicRepository.getMinors();
        await redis.set(`minors:all`, JSON.stringify(res), { ex: Number(process.env.UPSTASH_REDIS_EXPIRY) });
        return new ResponseEntity(200, res);

    } catch(err) {
        if (err instanceof Error) {
            return { status: 500, errorMessage: err.message };
        }
        return { status: 500, errorMessage: "Internal Server Error" };
    }
}