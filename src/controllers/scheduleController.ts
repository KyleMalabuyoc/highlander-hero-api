import { NextFunction, Request, Response } from "express";
import * as scheduleService from '../services/ScheduleService.js';

export const getSchedules = async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json(await scheduleService.getSchedules(req));
}

export const createNewSchedule = async(req: Request, res: Response, next: NextFunction) => {
    res.status(200).json(await scheduleService.createNewSchedule(req));
}

export const editNewSchedule = async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json(await scheduleService.editSchedule(req));
}
