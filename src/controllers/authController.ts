import { Request, Response } from "express";
import * as authService from '../services/AuthService.js';

// authentication - grabs tokens
export const login = async (req: Request, res: Response) => {
    res.status(200).json(await authService.login(req.body.email, req.body.password));
}

// confirm confirmation code from registration
export const confirm = async (req: Request, res: Response) => {
    res.status(200).json(await authService.confirm(req.body.email, req.body.code));
}

// resend confirmation code
export const resendCode = async (req: Request, res: Response) => {
    res.status(200).json(await authService.resendCode(req.body.email));
}

// cancel registration process
export const cancel = async (req: Request, res: Response) => {
    res.status(200).json(await authService.cancel(req.body.email));
}

// refresh token if access token expires
export const refresh = (req: Request, res: Response) => {
    res.status(200).json(authService.refresh(req.body));
}

export const logout = (req: Request, res: Response) => {
    res.status(200).json(authService.logout(req.body));
}

// new user registration
export const register = async (req: Request, res: Response) => {
    res.status(200).json(await authService.register(req.body.email, req.body.password));
}