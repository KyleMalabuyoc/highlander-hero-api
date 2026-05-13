import { Request } from "express"
import * as userRepository from "../repositories/UserRepository.js"
import * as scheduleRepository from "../repositories/scheduleRepository.js";
import { db } from "../config/db.js";
import { schedules, users } from "../config/schema.js";
import { eq } from "drizzle-orm";
import { ResponseEntity } from "../types/ResponseEntity.js";
import * as llmService from './LLMService.js';
import { Schedule } from "../types/Schedule.js";

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
        const scheduleId = await scheduleRepository.saveNewSchedule(schedule, userid);

        // updating prerequisites object to return list of ids rather than list of courses. we resolve it on the UI
        const coursesWithListofIdsForPreq = schedule.semesters.map((s) => ({
            ...s,
            courses: s.courses.map((c) => ({...c, prerequisites: c.prerequisites.map((p) => p.id)}))
        }));

        return new ResponseEntity(200, {...schedule, id: scheduleId, semesters: coursesWithListofIdsForPreq });
 
    } catch(err) {

        return new ResponseEntity(500, "Internal Server Error.");
    }

}

export const llmEditSchedule = async (req: Request): Promise<ResponseEntity> => {

    try {

        const updatedSchedule = await llmService.editSchedule(req.body.schedule, req.body.semesterIndex, req.body.query);
        return new ResponseEntity(200, updatedSchedule);

    } catch(e) {

        return new ResponseEntity(500, "Internal Server Error.");
    }

}

export const updateSchedule = async (req: Request): Promise<ResponseEntity> => {

    try {

        

        // call repository to handle DB calls
        const updated = await scheduleRepository.updateSchedule(req.body);
        return new ResponseEntity(200, updated);

    } catch(e) {

        // logs
        console.error(e);

        return new ResponseEntity(500, false, "Internal Server Error.");
    }


}