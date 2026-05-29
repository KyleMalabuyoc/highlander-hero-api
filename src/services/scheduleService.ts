import { Request } from "express"
import * as userRepository from "../repositories/UserRepository.js"
import * as scheduleRepository from "../repositories/scheduleRepository.js";
import { db } from "../config/db.js";
import { schedules, users } from "../config/schema.js";
import { eq } from "drizzle-orm";
import { ResponseEntity } from "../types/ResponseEntity.js";
import * as llmService from './LLMService.js';
import { formatMsg, logger } from '../config/logger/pino.js';
import { SCHEDULE_SERVICE, SCHEDULE_METHODS } from '../types/logging.js';
import { Schedule } from "../types/Schedule.js";

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

        const updated = await scheduleRepository.updateSchedule(req.body);

        logger.info(formatMsg(SCHEDULE_SERVICE, SCHEDULE_METHODS.UPDATE_SCHEDULE), "Schedule changes have been updated and saved.");

        return new ResponseEntity(200, updated);

    } catch(e) {
        logger.error({ ...formatMsg(SCHEDULE_SERVICE, SCHEDULE_METHODS.UPDATE_SCHEDULE), err: e }, 'Update schedule error.');
        return new ResponseEntity(500, false, "Internal Server Error.");
    }


}