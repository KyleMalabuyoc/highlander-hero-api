import { NextFunction, Request, Response } from "express";
import { ipValidation, ratelimiter } from "../utils/utils.js";
import { ResponseEntity } from "../types/ResponseEntity.js";
import { isIP } from 'net';

export const rateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {

    // || !isIP(req.ip) || !ipValidation(req.ip)
    if (req.ip === undefined || req.ip == null) {
        return res.status(400).json({ message: 'Invalid request' });
    }

    const allowed = await ratelimiter(req.ip, 5, 60000);

    if (!allowed) {
        res.status(429).json(new ResponseEntity(429, {}, "Request failed. Try again in a few seconds."));
    } else {
        next();
    }

}