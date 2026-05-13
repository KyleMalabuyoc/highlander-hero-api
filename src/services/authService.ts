import { Request, Response } from "express";
import { LoginInfo } from "../types/LoginInfo.js";
import { dummyLoginResponse } from "../temp/dummyData.js";
import { AdminGetUserCommand, AdminInitiateAuthCommand, AuthFlowType, CodeMismatchException, CognitoIdentityProviderClient, ConfirmSignUpCommand, ExpiredCodeException, GlobalSignOutCommand, InvalidParameterException, LimitExceededException, NotAuthorizedException, ResendConfirmationCodeCommand, RevokeTokenCommand, SignUpCommand, TooManyRequestsException, UsernameExistsException, UserNotFoundException } from "@aws-sdk/client-cognito-identity-provider";
import 'dotenv/config';
import { db } from "../config/db.js";
import { users } from "../config/schema.js";
import { ResponseEntity } from "../types/ResponseEntity.js";
import { RegisterResponse } from "../types/responses/CognitoResponse.js";
import redis from "../config/redis.js";
import { access } from "fs";

const client = new CognitoIdentityProviderClient({});

export const login = async (email: string, password: string): Promise<ResponseEntity> => {

    // levergaing AdminInitiateAuthCommand
    // once in ECS, ECS execution task loads temp creds for us
    // AdminInitiateAuthCommand / AWS sdk grabs creds and uses those for cognito calls
    // AdminInitiateAuthCommand use client id and IAM user

    const command = new AdminInitiateAuthCommand({
        ClientId: process.env.AWS_COGNITO_CLIENT_ID,
        UserPoolId: process.env.AWS_USER_POOL_ID,
        AuthFlow: AuthFlowType.ADMIN_USER_PASSWORD_AUTH,
        AuthParameters: { USERNAME: email, PASSWORD: password }
    });

    try {

        const res = await client.send(command);
        return new ResponseEntity(200, { access: {
            accessToken: res.AuthenticationResult?.AccessToken,
            expiresIn: res.AuthenticationResult?.ExpiresIn,
            idToken: res.AuthenticationResult?.IdToken,
            refreshToken: res.AuthenticationResult?.RefreshToken,
            tokenType: res.AuthenticationResult?.TokenType
        }, cognitoStatus: 'authenticated' });

    } catch(err) {

        if (err instanceof UserNotFoundException) {
            return new ResponseEntity(400, { cognitoStatus: "user-not-found"}, "User not found.");
        }

        if (err instanceof NotAuthorizedException) {
            return new ResponseEntity(401, { cognitoStatus: "not-authenticated" }, "Username or password is incorrect.");
        }
        
        console.error(err);
        return new ResponseEntity(500, {});
    }

}

export const register = async (email: string, password: string): Promise<ResponseEntity> => {

    const command = new SignUpCommand({
        ClientId: process.env.AWS_COGNITO_CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [
            { Name: 'email', Value: email }
        ]
    });

    try {

        const result = await client.send(command);
        await db.insert(users).values({ userSub: result.UserSub });

        const resdata: RegisterResponse = { message: "Registration successful. Check your email for a verification code.", destination: result.CodeDeliveryDetails?.Destination, cognitoStatus: 'confirm-code' };
        return new ResponseEntity(200, resdata);

    } catch(err) {

        if (err instanceof UsernameExistsException) {

            const user = await client.send(new AdminGetUserCommand({
                UserPoolId: process.env.AWS_USER_POOL_ID,
                Username: email
            }));

            if (user.UserStatus === 'CONFIRMED') {
                return new ResponseEntity(400, { message: 'An account with this email already exists.', cognitoStatus: 'account-exists'});
            }

            // check cache first to see if user is locked out for 24 hours
            // if so, dont send the code
            const attempts = await redis.get<number>(`confirm-attempts:${email}`) ?? 0;

            if (attempts >= 3) {
                return new ResponseEntity(429, { cognitoStatus: 'too-many-requests'});
            }

            // in the scenario that the user exceeds the amount of times allowed for a code entry

            if (user.UserStatus === 'UNCONFIRMED') {

                const result = await client.send(new ResendConfirmationCodeCommand({
                    ClientId: process.env.AWS_COGNITO_CLIENT_ID,
                    Username: email
                }));

                return new ResponseEntity(200, { message: "Registration successful. Check your email for a verification code.", destination: result.CodeDeliveryDetails?.Destination, cognitoStatus: 'confirm-code' })
            }
        }

        return new ResponseEntity(500, {}, "Internal server error: " + err);
    }
}

// confirm registration code
export const confirm = async (email: string, code: string): Promise<ResponseEntity> => {

    const command = new ConfirmSignUpCommand({
        ClientId: process.env.AWS_COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: code
    });

    // grab current amount of attempts from cache - increments first then returns value
    const attempts = await redis.incr(`confirm-attempts:${email}`).catch(err => new ResponseEntity(500, {}, "Internal server error." + err));

    // TODO: maybe global exception handler -> generic
    try {

        // first attempt, set expiry
        if (attempts === 1) {
            await redis.expire(`confirm-attempts:${email}`, Number(process.env.UPSTASH_REDIS_EXPIRY));
        }
        
        await client.send(command);
        return  new ResponseEntity(200, { cognitoStatus: 'confirmed' });

    } catch(err) {

        if (err instanceof UserNotFoundException) {
            return new ResponseEntity(404, { cognitoStatus: 'user-not-found' });
        }

        if (err instanceof LimitExceededException) {
            return new ResponseEntity(429, { cognitoStatus: 'too-many-requests'});
        }

        if (err instanceof ExpiredCodeException) {
            return new ResponseEntity(400, { cognitoStatus: 'code-expired' })
        }

        if (err instanceof CodeMismatchException || err instanceof InvalidParameterException) {

            // const attempts = await redis.get<number>(`confirm-attempts:${email}`) ?? 0;

            if (attempts == 3) {
                return new ResponseEntity(429, { cognitoStatus: 'too-many-requests'});
            }

            return new ResponseEntity(400 , { cognitoStatus: 'code-mismatch' });
        }

        return new ResponseEntity(500, {}, "Internal server error." + err);
    }

}

export const resendCode = async (email: string): Promise<ResponseEntity> => {

    const command = new ResendConfirmationCodeCommand({
        ClientId: process.env.AWS_COGNITO_CLIENT_ID,
        Username: email
    });

    // TODO: maybe global exception handler -> generic
    try {

        const resends = await redis.incr(`resend-code:${email}`);

        if (resends == 1) {
            // need to reset confirm attempts for new code - dont want to remember previous attempts
            await redis.del(`confirm-attempts:${email}`);
            await redis.expire(`resend-code:${email}`, Number(process.env.UPSTASH_REDIS_EXPIRY));
        }

        if (resends > 1) {
            return new ResponseEntity(429, { cognitoStatus: 'too-many-requests' });
        }

        await client.send(command);
        return  new ResponseEntity(200, { cognitoStatus: 'code-resent' });

    } catch(err) {
       
        if (err instanceof UserNotFoundException) {
            return new ResponseEntity(404, { cognitoStatus: 'user-not-found' });
        }

        if (err instanceof InvalidParameterException) {
            return new ResponseEntity(400, { cognitoStatus: 'already-confirmed' });
        }

        if (err instanceof LimitExceededException || err instanceof TooManyRequestsException) {
            return new ResponseEntity(429, { cognitoStatus: 'too-many-requests' });
        }

        return new ResponseEntity(500, {}, "Internal server error: " + err);
    }
}

export const refresh = async (req: Request): Promise<ResponseEntity> => {

    try {

        const refreshToken = req.cookies['refreshToken'];

        const command = new AdminInitiateAuthCommand({
            "AuthFlow": "REFRESH_TOKEN_AUTH",
            "ClientId": process.env.AWS_COGNITO_CLIENT_ID,
            "UserPoolId": process.env.AWS_USER_POOL_ID,
            "AuthParameters": {
                "REFRESH_TOKEN": refreshToken
            }
        });

        const res = await client.send(command);

        return new ResponseEntity(200, { access: {
            accessToken: res.AuthenticationResult?.AccessToken,
            expiresIn: res.AuthenticationResult?.ExpiresIn,
            idToken: res.AuthenticationResult?.IdToken,
            tokenType: res.AuthenticationResult?.TokenType
        }, cognitoStatus: 'authenticated' });

    } catch(err) {

        if (err instanceof NotAuthorizedException) {
            // most common - token expired or revoked, force re-login
            return new ResponseEntity(401, { cognitoStatus: 'session-expired' }, 'Session expired. Please log in again.');
        }

        if (err instanceof UserNotFoundException) {
            return new ResponseEntity(401, { cognitoStatus: 'user-not-found' }, 'Account not found.');
        }

        if (err instanceof TooManyRequestsException) {
            return new ResponseEntity(429, { cognitoStatus: 'too-many-requests' }, 'Too many requests. Try again later.');
        }

        if (err instanceof InvalidParameterException) {
            return new ResponseEntity(400, { cognitoStatus: 'invalid-token' }, 'Invalid refresh token.');
        }

        return new ResponseEntity(500, {}, 'Internal server error.');
    }
}

export const logout = async (req: Request): Promise<ResponseEntity> => {

    try {

        const accessToken = req.headers.authorization?.split(' ')[1] ?? '';

        // in the case that the access token isnt available - return false to let UI know logout failed
        if (accessToken === '') {
            return new ResponseEntity(400, false, "Unable to perform logout.");
        }

        // this is really only invalidating the refreshtoken
        const command = new GlobalSignOutCommand({
            AccessToken: accessToken
        });

        await client.send(command);

        return new ResponseEntity(200, true);
    
    } catch(err) {
        return new ResponseEntity(500, false, "Internal server error. " + err);
    }
}

export const cancel = async (email: string): Promise<ResponseEntity> => {

    try {

        await redis.del(`confirm-attempts:${ email }`);
        await redis.del(`resend-code:${ email }`);

        // do we need a cancel count?? to limit user cancel requests
        return new ResponseEntity(200, true);

    } catch(err) {

        return new ResponseEntity(500, {}, "Internal server error. " + err);
    }
}