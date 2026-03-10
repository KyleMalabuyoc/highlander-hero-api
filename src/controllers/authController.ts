import { Request, Response } from "express";
import * as authService from '../services/AuthService.js';

// authentication - grabs tokens
export const login = async (req: Request, res: Response) => {
    res.status(200).json(await authService.login(req));
}

// confirm confirmation code from registration
export const confirm = async (req: Request, res: Response) => {
    res.status(200).json(await authService.confirm(req));
}

// resend confirmation code
export const resendCode = async (req: Request, res: Response) => {
    res.status(200).json(await authService.resendCode(req));
}

// cancel registration process
export const cancel = async (req: Request, res: Response) => {
    res.status(200).json(await authService.cancel(req));
}

// refresh token if access token expires
export const refresh = (req: Request, res: Response) => {
    res.status(200).json(authService.refresh(req));
}

export const logout = (req: Request, res: Response) => {
    res.status(200).json(authService.logout(req));
}

// new user registration
export const register = async (req: Request, res: Response) => {
    res.status(200).json(await authService.register(req));
}