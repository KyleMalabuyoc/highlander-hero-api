import { Request, Response } from "express";
import * as courseService from '../services/AcademicsService.js';

export const getCourses = async (req: Request, res: Response) => {
    res.status(200).json(await courseService.getCourses());
}

export const getMajors = async (req: Request, res: Response) => {
    res.status(200).json(await courseService.getMajors());
}

export const getMinors = async (req: Request, res: Response) => {
    res.status(200).json(await courseService.getMinors());
}
