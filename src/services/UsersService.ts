
import { Request } from "express";
import { ResponseEntity } from "../types/ResponseEntity.js";

export const userInfo = async (req: Request): Promise<ResponseEntity> => {

    console.log("hello world", req.body);
    // db call to grab user info, need user sub  

    return new ResponseEntity(200, {})
}