import { Request } from "express"
import * as userRepository from "../repositories/UserRepository.js"
import * as scheduleRepository from "../repositories/ScheduleRepository.js";
import { ResponseEntity } from "../types/ResponseEntity.js";
import * as llmService from './LLMService.js';
import { formatMsg, logger } from '../config/logger/pino.js';
import { SCHEDULE_SERVICE, SCHEDULE_METHODS } from '../types/Logging.js';
import { db } from "../config/db.js";
import { schedules, semesters, users } from "../config/schema.js";
import { eq } from "drizzle-orm";

export const getSchedules = async (req: Request): Promise<ResponseEntity> => {

    try {
        const userid = await userRepository.getUserId(req.user?.sub, req.user?.username);
        const schedules = await scheduleRepository.getSchedules(userid);

        logger.info(formatMsg(SCHEDULE_SERVICE, SCHEDULE_METHODS.GET_SCHEDULES), "Grabbing users schedules.");

        return new ResponseEntity(200, schedules);
    } catch(err) {
        logger.error({ ...formatMsg(SCHEDULE_SERVICE, SCHEDULE_METHODS.GET_SCHEDULES), err }, 'Get schedules error.');
        return new ResponseEntity(500, "Internal Server Error.");
    }
}

export const createNewSchedule = async (req: Request): Promise<ResponseEntity> => {

    try {

        // generate schedule
        const schedule = await llmService.createSchedule(req.body);

        // grab userid for saving schedule
        const userid = await userRepository.getUserId(req.user?.sub, req.user?.username);
        
        // save new schedule
        const scheduleId = await scheduleRepository.saveNewSchedule(schedule, userid);

        // updating prerequisites object to return list of ids rather than list of courses. we resolve it on the UI
        const coursesWithListofIdsForPreq = schedule.semesters.map((s) => ({
            ...s,
            courses: s.courses.map((c) => ({...c, prerequisites: c.prerequisites.map((p) => p.id)}))
        }));

        logger.info(formatMsg(SCHEDULE_SERVICE, SCHEDULE_METHODS.CREATE_NEW_SCHEDULE), "Created users new schedule.");

        return new ResponseEntity(200, {...schedule, id: scheduleId, semesters: coursesWithListofIdsForPreq });
 
    } catch(err) {
        logger.error({ ...formatMsg(SCHEDULE_SERVICE, SCHEDULE_METHODS.CREATE_NEW_SCHEDULE), err }, 'Create schedule error.');
        return new ResponseEntity(500, "Internal Server Error.");
    }

}

export const llmEditSchedule = async (req: Request): Promise<ResponseEntity> => {

    try {

        const updatedSchedule = await llmService.editSchedule(req.body.schedule, req.body.semesterIndex, req.body.query);

        logger.info(formatMsg(SCHEDULE_SERVICE, SCHEDULE_METHODS.LLM_EDIT_SCHEDULE), "LLM responded to user.");

        return new ResponseEntity(200, updatedSchedule);

    } catch(e) {
        logger.error({ ...formatMsg(SCHEDULE_SERVICE, SCHEDULE_METHODS.LLM_EDIT_SCHEDULE), err: e }, 'LLM edit schedule error.');
        return new ResponseEntity(500, "Internal Server Error.");
    }

}

export const updateSchedule = async (req: Request): Promise<ResponseEntity> => {

    try {

        // validate that the semesterId 
        if(!(await validateUserSubBySemesterId(req.body.semesterId, req.user?.sub || ""))) {
            logger.error(formatMsg(SCHEDULE_SERVICE, SCHEDULE_METHODS.VALIDATE_USER_SUB), 'Schedule does not belong to this user.');
            return new ResponseEntity(401, false, "Schedule does not belong to this user.");
        }

        const updated = await scheduleRepository.updateSchedule(req.body);

        logger.info(formatMsg(SCHEDULE_SERVICE, SCHEDULE_METHODS.UPDATE_SCHEDULE), "Schedule changes have been updated and saved.");

        return new ResponseEntity(200, updated);

    } catch(err) {
        logger.error({ ...formatMsg(SCHEDULE_SERVICE, SCHEDULE_METHODS.UPDATE_SCHEDULE), err }, 'Update schedule error.');
        return new ResponseEntity(500, false, "Internal Server Error.");
    }

}

/**
 * 
 * Helper Function
 * 
 * validateUserSubBySemesterId -> grab the user sub belonging to the semesterId and cross check it with the 
 * request user sub coming in
 *
 */

const validateUserSubBySemesterId = async (semesterId: number, userSub: string) => {

    try {

        // DB call everytime we update the schedule might need to optimize later on
        const userSubOfSemesterId = await db.select({ userSub: users.userSub })
            .from(users)
            .innerJoin(schedules, eq(schedules.userId, users.id))
            .innerJoin(semesters, eq(semesters.scheduleId, schedules.id))
            .where(eq(semesters.id, semesterId));

        return userSubOfSemesterId[0].userSub === userSub;

    } catch(err) {

        logger.error({ ...formatMsg(SCHEDULE_SERVICE, SCHEDULE_METHODS.VALIDATE_USER_SUB), err }, 'Error grabbing user sub.');
        return false;
    }
}
