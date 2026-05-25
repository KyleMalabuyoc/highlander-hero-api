import { Request, Response } from "express";
import * as courseService from '../services/AcademicsService.js';
import { logger } from "../config/logger/pino.js";

export const getCourses = async (req: Request, res: Response) => {
    res.status(200).json(await courseService.getCourses());
}

export const getMajors = async (req: Request, res: Response) => {
    //  logger.info({userId: req.user?.username, txId: '', route: '/majors'}, "Grabbing minor programs.")
    res.status(200).json(await courseService.getMajors());
}

export const getMinors = async (req: Request, res: Response) => {
    // logger.info({userId: req.user?.username, txId: '', route: '/minors'}, "Grabbing minor programs.")
    res.status(200).json(await courseService.getMinors());
}
