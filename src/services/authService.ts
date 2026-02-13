import { Request } from "express";
import { LoginInfo } from "../types/LoginInfo.js";
import { dummyLoginResponse } from "../temp/dummyData.js";

export const login = (req: Request): LoginInfo => {
    return dummyLoginResponse
}