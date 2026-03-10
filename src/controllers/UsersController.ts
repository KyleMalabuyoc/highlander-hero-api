import { Request, Response } from "express";
import * as userService from '../services/UsersService.js';

// grabs user information - schedules, etc.
export const userInfo = async (req: Request, res: Response) => {
    res.status(200).json(await userService.userInfo(req));
}