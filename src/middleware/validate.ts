import { NextFunction, Request, Response } from "express";

export const validate = (req: Request, res: Response, next: NextFunction) => {
    console.log("validating req body with schema", req.body);
    next();
}