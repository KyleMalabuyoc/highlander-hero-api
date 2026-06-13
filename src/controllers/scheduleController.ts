import { Request, Response } from "express";
import * as scheduleService from '../services/scheduleService.js';

export const getSchedules = async (req: Request, res: Response) => {

    const result = await scheduleService.getSchedules(req);

    if (result.status !== 200) {
        return res.status(result.status).json(result);
    } 

    return res.status(200).json(result);
}

export const createNewSchedule = async(req: Request, res: Response) => {

    const result = await scheduleService.createNewSchedule(req);

    if (result.status !== 200) {
        return res.status(result.status).json(result);
    }

    return res.status(200).json(result);
}

export const llmEditNewSchedule = async (req: Request, res: Response) => {

    const result = await scheduleService.llmEditSchedule(req);
    
    if (result.status !== 200) {
        return res.status(result.status).json(result);
    }

    return res.status(200).json(result);
}

export const updateSchedule = async (req: Request, res: Response) => {

    const result = await scheduleService.updateSchedule(req);
    
    if (result.status !== 200) {
        return res.status(result.status).json(result);
    }

    return res.status(200).json(result);
}
