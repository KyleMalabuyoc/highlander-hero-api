import { NextFunction, Request, Response } from "express";
import * as loginService from '../services/authService.js';

export const login = (req: Request, res: Response) => {
    res.status(200).json(loginService.login(req));
}