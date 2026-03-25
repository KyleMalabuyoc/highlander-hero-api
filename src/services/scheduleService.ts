import { Request } from "express"
import * as userRepository from "../repositories/UserRepository.js"
import * as scheduleRepository from "../repositories/ScheduleRepository.js";
import { db } from "../config/db.js";
import { schedules, users } from "../config/schema.js";
import { eq } from "drizzle-orm";
import { ResponseEntity } from "../types/ResponseEntity.js";
import { NewScheduleRequest } from "../types/requests/NewScheduleRequest.js";

export const getSchedules = async (req: Request): Promise<ResponseEntity> => {

    const userid = await userRepository.getUserId(req.user?.sub, req.user?.username);
    
    // const schedules = db.select({""});

    // schedule building flow

    // need semesters
    // need courses
    
    // need to grab schedule id first, then query the semesters table for all semesters belonging to that schedule
    // with all semesters, query semesters courses table

    // need to map out design for building schedules object

    // need to build entire object - need left joins or Drizzle relational API
    const schedules = await scheduleRepository.getSchedules(userid);

    return new ResponseEntity(200, schedules);
}

export const saveNewSchedule = async (req: NewScheduleRequest): Promise<ResponseEntity> => {


    console.log("Time to feed this to the LLM", req);

    // construct a prompt with the given data => need service prompts as wlel, one for each command
    // so this one would be "The current user wants to CREATE a new schedule"
    // need to provide some instructions for the LLM to follow formatting of data for requests and responses.


    return new ResponseEntity(200, {});
}