import redis from "../config/redis.js";
import { Major, Minor } from "../types/AcademicProgram.js";
import { Course } from "../types/Course.js";
import { ResponseEntity } from "../types/ResponseEntity.js";
import * as academicRepository from "../repositories/AcademicsRepository.js";
import { formatMsg, logger } from "../config/logger/pino.js";
import { ACADEMIC_SERVICE, ACADEMIC_METHODS } from "../types/Logging.js";

export const getCourses = async (): Promise<ResponseEntity> => {

    try {

        // typing so upstash knows what to deserialize to. even without it, it deserializes
        const cache = await redis.get<Course[]>(`courses:all`);

        if (cache !== null) { // hit
            logger.info(formatMsg(ACADEMIC_SERVICE, ACADEMIC_METHODS.GET_COURSES), "Grabbed courses from cache. Cache hit.");
            return new ResponseEntity(200, cache);
        }

    } catch(err) {
        logger.error({ ...formatMsg(ACADEMIC_SERVICE, ACADEMIC_METHODS.GET_COURSES), err }, 'Error.' );
    }
    
    // cache not available
    try {

        const res = await academicRepository.getCourses();
        const coursesMap = new Map();

        res.forEach((r) => {

            if (coursesMap.get(r.id) === undefined) {
                coursesMap.set(r.id, { ...r });
            }

        });

        logger.info(formatMsg(ACADEMIC_SERVICE, ACADEMIC_METHODS.GET_COURSES), "Grabbed courses from DB. Cache miss.");

        const allCourses = Array.from(coursesMap.values());
        await redis.set(`courses:all`, JSON.stringify(allCourses),  { ex: Number(process.env.UPSTASH_REDIS_EXPIRY) });
        return new ResponseEntity(200, allCourses);

    } catch(err) {

        logger.error({ ...formatMsg(ACADEMIC_SERVICE, ACADEMIC_METHODS.GET_COURSES), err }, 'DB Error.' );
        return new ResponseEntity(500, { err }, "Something went wrong. Please try again later.");
    }
}

export const getMajors = async (): Promise<ResponseEntity> => {

    try {

        const cache = await redis.get<Major[]>(`majors:all`);

        if (cache !== null) {
            logger.info(formatMsg(ACADEMIC_SERVICE, ACADEMIC_METHODS.GET_MAJORS), "Grabbed majors from cache. Cache hit.");
            return new ResponseEntity(200, cache);
        }

    } catch(err) {
        logger.error({ ...formatMsg(ACADEMIC_SERVICE, ACADEMIC_METHODS.GET_MAJORS), err }, 'Cache Error.' );
    }

    try {

        const res = await academicRepository.getMajors();

        logger.info(formatMsg(ACADEMIC_SERVICE, ACADEMIC_METHODS.GET_MAJORS), "Grabbed majors from DB. Cache miss.");

        await redis.set(`majors:all`, JSON.stringify(res), { ex: Number(process.env.UPSTASH_REDIS_EXPIRY) });
        return new ResponseEntity(200, res);

    } catch(err) {

        logger.error({ ...formatMsg(ACADEMIC_SERVICE, ACADEMIC_METHODS.GET_MAJORS), err }, 'DB Error.' );
        return new ResponseEntity(500, { err }, "Something went wrong. Please try again later.");
    }
}

export const getMinors = async (): Promise<ResponseEntity> => {

    try {

        const cache = await redis.get<Minor[]>(`minors:all`);

        if (cache !== null) {
            logger.info(formatMsg(ACADEMIC_SERVICE, ACADEMIC_METHODS.GET_MINORS), "Grabbing minors from cache. Cache hit.");
            return new ResponseEntity(200, cache);
        }

    } catch(err) {
        logger.error({ ...formatMsg(ACADEMIC_SERVICE, ACADEMIC_METHODS.GET_MINORS), err }, 'Cache Error.' );
    }

    try {

        const res = await academicRepository.getMinors();

        logger.info(formatMsg(ACADEMIC_SERVICE, ACADEMIC_METHODS.GET_MINORS), "Grabbed minors from DB. Cache miss.");

        await redis.set(`minors:all`, JSON.stringify(res), { ex: Number(process.env.UPSTASH_REDIS_EXPIRY) });
        return new ResponseEntity(200, res);

    } catch(err) {

        logger.error({ ...formatMsg(ACADEMIC_SERVICE, ACADEMIC_METHODS.GET_MINORS), err }, 'DB Error.' );
        return new ResponseEntity(500, { err }, "Something went wrong. Please try again later.");
    }
}
