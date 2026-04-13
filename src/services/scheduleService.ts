import { Request } from "express"
import * as userRepository from "../repositories/UserRepository.js"
import * as scheduleRepository from "../repositories/scheduleRepository.js";
import { db } from "../config/db.js";
import { schedules, users } from "../config/schema.js";
import { eq } from "drizzle-orm";
import { ResponseEntity } from "../types/ResponseEntity.js";
import { NewScheduleRequest } from "../types/requests/NewScheduleRequest.js";
import * as llmService from './LLMService.js';

export const getSchedules = async (req: Request): Promise<ResponseEntity> => {

    const userid = await userRepository.getUserId(req.user?.sub, req.user?.username);
    const schedules = await scheduleRepository.getSchedules(userid);

    return new ResponseEntity(200, schedules);
}

export const createNewSchedule = async (req: Request): Promise<ResponseEntity> => {

    try {

        // generate schedule
        const schedule = await llmService.createSchedule(req.body);

        // grab userid for saving schedule
        const userid = await userRepository.getUserId(req.user?.sub, req.user?.username);
        
        // save new schedule
        scheduleRepository.saveNewSchedule(schedule, userid);

        return new ResponseEntity(200, schedule);

    } catch(err) {

        return new ResponseEntity(500, "Internal Server Error.");
    }

}

export const editSchedule = async (req: Request): Promise<ResponseEntity> => {

    try {

        const updatedSchedule = await llmService.editSchedule(req.body.schedule, req.body.semesterIndex, req.body.query);
        return new ResponseEntity(200, updatedSchedule);

    } catch(e) {

        return new ResponseEntity(500, "Internal Server Error.");
    }

}