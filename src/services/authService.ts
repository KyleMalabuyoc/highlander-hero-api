import { Request } from "express";
import { LoginInfo } from "../types/LoginInfo.js";
import { dummyLoginResponse } from "../temp/dummyData.js";
import { CognitoIdentityProviderClient, SignUpCommand } from "@aws-sdk/client-cognito-identity-provider";
import 'dotenv/config';
import { RegisterInfo } from "../types/RegisterInfo.js";
import { db } from "../config/db.js";
import { users } from "../config/schema.js";
import { ResponseEntity } from "../types/ResponseEntity.js";
import { RegisterResponse } from "../types/responses/CognitoResponse.js";
// need to take care of unhappy cases as well

export const login = (req: Request): LoginInfo => {
    return dummyLoginResponse;
}

export const register = async (req: Request): Promise<ResponseEntity> => {

    const registrationInfo: RegisterInfo = req.body;
    const client = new CognitoIdentityProviderClient({});

    /**
     * 
     * User sends register information
     * we make an API call to cognito to add this user to user pool
     * need to confirm this users email by sending a code to their email
     * user types in code to another page and we make a confirmSignup API call
     * successfully adds users to the user pool and redirects back to the login page
     * 
     */

    const command = new SignUpCommand({
        ClientId: process.env.AWS_COGNITO_CLIENT_ID,
        Username: registrationInfo.email,
        Password: registrationInfo.password,
        UserAttributes: [
            { Name: 'email', Value: registrationInfo.email }
        ]
    });

    try {

        const result = await client.send(command);
        await db.insert(users).values({ userSub: result.UserSub });

        const resdata: RegisterResponse = { message: "Registration successful. Check your email for a verification code.", destination: result.CodeDeliveryDetails?.Destination, cognitoStatus: 'confirm-code' };

        return new ResponseEntity(200, resdata);

    } catch(err) {
        console.error(err);
        return new ResponseEntity(200, {}, "Internal server error: " + err);
    }
}

export const refresh = (req: Request): LoginInfo => {
    return dummyLoginResponse;
}

export const confirm = (req: Request): LoginInfo => {
    return dummyLoginResponse;
}

export const logout = (req: Request): LoginInfo => {
    return dummyLoginResponse;
}