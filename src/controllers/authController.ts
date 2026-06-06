import { Request, Response } from "express";
import * as authService from '../services/authService.js';

// authentication - grabs tokens
export const login = async (req: Request, res: Response) => {

    try {

        const loginResponseEntity = await authService.login(req.body.email, req.body.password);

        const { refreshToken } = loginResponseEntity.data.access;

        // set httponly cookie for refreshtoken to be stored in browser

        if (refreshToken && loginResponseEntity?.status === 200) {
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000
            });

            // remove refreshtoken from body of response entity
            delete loginResponseEntity.data.access.refreshToken;
        }
        
        res.status(200).json(loginResponseEntity);
        
    } catch(err) {
        console.error(err);
    }
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
export const refresh = async (req: Request, res: Response) => {
    res.status(200).json(await authService.refresh(req));
}

export const logout = async (req: Request, res: Response) => {
    // on logout - remove refresh token from browser
    res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
    });
    res.status(200).json(await authService.logout(req));
}

// new user registration
export const register = async (req: Request, res: Response) => {
    res.status(200).json(await authService.register(req.body.email, req.body.password));
}