import { NextFunction, Request, Response } from "express";
import * as loginService from '../services/authService.js';

export const login = (req: Request, res: Response) => {
    res.status(200).json(loginService.login(req));
}

export const confirm = async (req: Request, res: Response) => {
    res.status(200).json(await loginService.confirm(req));
}

export const resendCode = async (req: Request, res: Response) => {
    res.status(200).json(await loginService.resendCode(req));
}

export const refresh = (req: Request, res: Response) => {
    res.status(200).json(loginService.refresh(req));
}

export const logout = (req: Request, res: Response) => {
    res.status(200).json(loginService.logout(req));
}

export const register = async (req: Request, res: Response) => {
    res.status(200).json(await loginService.register(req));
}