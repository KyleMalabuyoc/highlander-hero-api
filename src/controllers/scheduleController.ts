import { NextFunction, Request, Response } from "express";
import * as scheduleService from '../services/ScheduleService.js';

export const getSchedules = async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json(await scheduleService.getSchedules(req));
}

export const createNewSchedule = async(req: Request, res: Response, next: NextFunction) => {
    res.status(200).json(await scheduleService.createNewSchedule(req));
}

export const llmEditNewSchedule = async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json(await scheduleService.llmEditSchedule(req));
}

export const updateSchedule = async (req: Request, res: Response) => {
    res.status(200).json(await scheduleService.updateSchedule(req));
}
