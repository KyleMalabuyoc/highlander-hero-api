import { Request, Response } from "express";
import * as courseService from '../services/AcademicsService.js';

export const getCourses = async (req: Request, res: Response) => {

    const result = await courseService.getCourses();

    if (result.status !== 200) {
        return res.status(result.status).json(result);
    }

    return res.status(200).json(result);
}

export const getMajors = async (req: Request, res: Response) => {

    const result = await courseService.getMajors();
    
    if (result.status !== 200) {
        return res.status(result.status).json(result);
    }
    return res.status(200).json(result);
}

export const getMinors = async (req: Request, res: Response) => {
    const result = await courseService.getMinors();
    if (result.status !== 200) {
        return res.status(result.status).json(result);
    }
    return res.status(200).json(result);
}
