import { Request, NextFunction, Response } from "express";
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { JwtParseError } from "aws-jwt-verify/error";
import { ResponseEntity } from "../types/ResponseEntity.js";
import { formatMsg, logger, runWithContext } from "../config/logger/pino.js";
import * as userRepository from '../repositories/UserRepository.js';

const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.AWS_USER_POOL_ID ?? '',
    tokenUse: 'access',
    clientId: process.env.AWS_COGNITO_CLIENT_ID ?? ''
});

let userId = -1;

export const validateAccess = async (req: Request, res: Response, next: NextFunction) => {

    const accessToken = req.headers.authorization?.split(' ')[1] ?? '';

    if (!accessToken) {
        logger.error(formatMsg("AUTHENTICATE", "validateAccess"), "Invalid access token." );
        return res.status(401).json(new ResponseEntity(401, {}, "Invalid access token."));
    }

    try {

       req.user = await verifier.verify(accessToken);
       if(userId === -1) { // if it was never set
        const userId = await userRepository.getUserId(req.user?.sub, req.user?.username);
        runWithContext(userId, () => next());
       }

    } catch(err) {

        if (err instanceof JwtParseError) {
            logger.error({ ...formatMsg("AUTHENTICATE", "validateAccess"), err }, 'Error grabbing access token.' );
        }

        return res.status(401).json(new ResponseEntity(401, {}, "Error grabbing access token."));
    }

}