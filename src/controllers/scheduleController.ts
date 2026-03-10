import { NextFunction, Request, Response } from "express";
import * as scheduleService from '../services/ScheduleService.js';

export const getSchedules = (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json(scheduleService.getSchedules());
}
