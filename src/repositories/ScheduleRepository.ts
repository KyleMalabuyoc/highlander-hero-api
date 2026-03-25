// getSchedules
import { Request } from "express";
import { Schedule } from "../types/Schedule.js"
import { db } from "../config/db.js";
import { schedules, users } from "../config/schema.js";
import { eq } from "drizzle-orm";
import { NewScheduleRequest } from "../types/requests/NewScheduleRequest.js";

export const getSchedules = async (userid: number | undefined): Promise<Schedule[]> => {

    try {

        const s = await db.select({
            scheduleName: schedules.scheduleName,
            totalCredits: schedules.totalCredits,
            studentInfoId: schedules.studentInfoId
        }).from(schedules).where(eq(schedules.userId, `${ userid?.toString() }`));

        console.log("SCHEDULE FOUND: ", s);

        return [];

    } catch(e) {
        console.error(e);
        return [];
    }
}

export const saveNewSchedule = async (newScheduleRequest: NewScheduleRequest): Promise<boolean> => {

    try {
        return false;
    } catch(e) {
        return false;
    }

}