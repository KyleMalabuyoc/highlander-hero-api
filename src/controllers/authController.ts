import { Request, Response } from "express";
import * as authService from '../services/authService.js';

export const login = async (req: Request, res: Response) => {

    const result = await authService.login(req.body.email, req.body.password);

    if (result.status !== 200) {
        return res.status(result.status).json(result);
    }

    const { refreshToken } = result.data.access;

    if (refreshToken) {
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });
        delete result.data.access.refreshToken;
    }

    return res.status(200).json(result);
}

export const register = async (req: Request, res: Response) => {

    const result = await authService.register(req.body.email, req.body.password);

    if (result.status !== 200) {
        return res.status(result.status).json(result);
    }

    return res.status(200).json(result);
}

export const confirm = async (req: Request, res: Response) => {

    const result = await authService.confirm(req.body.email, req.body.code);

    if (result.status !== 200) {
        return res.status(result.status).json(result);
    }

    return res.status(200).json(result);
}

export const resendCode = async (req: Request, res: Response) => {

    const result = await authService.resendCode(req.body.email);

    if (result.status !== 200) {
        return res.status(result.status).json(result);
    }

    return res.status(200).json(result);
}

export const cancel = async (req: Request, res: Response) => {

    const result = await authService.cancel(req.body.email);

    if (result.status !== 200) {
        return res.status(result.status).json(result);
    }

    return res.status(200).json(result);
}

export const refresh = async (req: Request, res: Response) => {

    const result = await authService.refresh(req);

    if (result.status !== 200) {
        return res.status(result.status).json(result);
    }

    return res.status(200).json(result);
}

export const logout = async (req: Request, res: Response) => {

    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });

    const result = await authService.logout(req);

    if (result.status !== 200) {
        return res.status(result.status).json(result);
    }
    
    return res.status(200).json(result);
}
