import { Request } from "express";
import { AdminGetUserCommand, AdminInitiateAuthCommand, AuthFlowType, CodeMismatchException, CognitoIdentityProviderClient, ConfirmSignUpCommand, ExpiredCodeException, GlobalSignOutCommand, InvalidParameterException, LimitExceededException, NotAuthorizedException, ResendConfirmationCodeCommand, RevokeTokenCommand, SignUpCommand, TooManyRequestsException, UsernameExistsException, UserNotFoundException } from "@aws-sdk/client-cognito-identity-provider";
import 'dotenv/config';
import { db } from "../config/db.js";
import { users } from "../config/schema.js";
import { ResponseEntity } from "../types/ResponseEntity.js";
import redis from "../config/redis.js";
import { RegisterResponse } from "../types/responses/Responses.js";
import { formatMsg, logger } from "../config/logger/pino.js";
import { AUTH_SERVICE, AUTH_METHODS } from "../types/Logging.js";

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

        logger.info(formatMsg(AUTH_SERVICE, AUTH_METHODS.LOGIN), "User authenticated successfully.");

        return new ResponseEntity(200, { access: {
            accessToken: res.AuthenticationResult?.AccessToken,
            expiresIn: res.AuthenticationResult?.ExpiresIn,
            idToken: res.AuthenticationResult?.IdToken,
            refreshToken: res.AuthenticationResult?.RefreshToken,
            tokenType: res.AuthenticationResult?.TokenType
        }, cognitoStatus: 'authenticated' });

    } catch(err) {

        if (err instanceof UserNotFoundException || err instanceof NotAuthorizedException) {
            return new ResponseEntity(401, { cognitoStatus: "not-authenticated" }, "Invalid email or password.");
        }

        logger.error({ ...formatMsg(AUTH_SERVICE, AUTH_METHODS.LOGIN), err }, 'Login error.');
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

        const cancelCount = await redis.get<number>(`register-cancel:${email}`) ?? 0;
        if (cancelCount >= 3) {
            logger.error(formatMsg(AUTH_SERVICE, AUTH_METHODS.REGISTER), 'Registration blocked due to too many cancellations.');
            return new ResponseEntity(429, { cognitoStatus: 'too-many-requests' });
        }

        const result = await client.send(command);
        await db.insert(users).values({ userSub: result.UserSub });

        const resdata: RegisterResponse = { message: "Registration successful. Check your email for a verification code.", destination: result.CodeDeliveryDetails?.Destination, cognitoStatus: 'confirm-code' };
        logger.info(formatMsg(AUTH_SERVICE, AUTH_METHODS.REGISTER), "User registered successfully.");

        return new ResponseEntity(200, resdata);

    } catch(err) {

        if (err instanceof UsernameExistsException) {

            const user = await client.send(new AdminGetUserCommand({
                UserPoolId: process.env.AWS_USER_POOL_ID,
                Username: email
            }));

            // user email is already confirmed and exists in cognito
            if (user.UserStatus === 'CONFIRMED') {
                logger.error({ ...formatMsg(AUTH_SERVICE, AUTH_METHODS.REGISTER), err }, 'An account with this email already exists.');
                return new ResponseEntity(400, { message: 'An account with this email already exists.', cognitoStatus: 'account-exists'});
            }

            // check to see how many times the user has attempted to get a code
            const attempts = await redis.get<number>(`confirm-attempts:${email}`) ?? 0;

            // if the user has attempted 3 or more confirm code attempts, prevent them
            if (attempts >= 3) {
                logger.error({ ...formatMsg(AUTH_SERVICE, AUTH_METHODS.REGISTER), err }, 'Too many failed registration attempts.');
                return new ResponseEntity(429, { cognitoStatus: 'too-many-requests'});
            }

            // user still has attempts left for code confirmation - their email exists in cognito but hasnt been confirmed
            if (user.UserStatus === 'UNCONFIRMED') {

                const result = await client.send(new ResendConfirmationCodeCommand({
                    ClientId: process.env.AWS_COGNITO_CLIENT_ID,
                    Username: email
                }));

                logger.info(formatMsg(AUTH_SERVICE, AUTH_METHODS.REGISTER), "Registration successful. Check your email for a verification code.");
                return new ResponseEntity(200, { message: "Registration successful. Check your email for a verification code.", destination: result.CodeDeliveryDetails?.Destination, cognitoStatus: 'confirm-code' })
            }
        }

        logger.error({ ...formatMsg(AUTH_SERVICE, AUTH_METHODS.REGISTER), err }, 'Register error.');
        return new ResponseEntity(500, {}, "Internal server error");
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
    const attempts = await redis.incr(`confirm-attempts:${email}`).catch(err => new ResponseEntity(500, {}, "Internal server error."));

    // TODO: maybe global exception handler -> generic
    try {

        // first attempt, set expiry
        if (attempts === 1) {
            await redis.expire(`confirm-attempts:${email}`, Number(process.env.UPSTASH_REDIS_EXPIRY));
        }
        
        await client.send(command);

        logger.info(formatMsg(AUTH_SERVICE, AUTH_METHODS.CONFIRM), "User confirmed successfully.");
        return  new ResponseEntity(200, { cognitoStatus: 'confirmed' });

    } catch(err) {

        if (err instanceof UserNotFoundException) {
            logger.error({ ...formatMsg(AUTH_SERVICE, AUTH_METHODS.CONFIRM), err }, 'User not found.');
            return new ResponseEntity(404, { cognitoStatus: 'user-not-found' });
        }

        if (err instanceof LimitExceededException) {
            logger.error({ ...formatMsg(AUTH_SERVICE, AUTH_METHODS.CONFIRM), err }, 'Too many attempts.');
            return new ResponseEntity(429, { cognitoStatus: 'too-many-requests'});
        }

        if (err instanceof ExpiredCodeException) {
            logger.error({ ...formatMsg(AUTH_SERVICE, AUTH_METHODS.CONFIRM), err }, 'Confirmation code is expired.');
            return new ResponseEntity(400, { cognitoStatus: 'code-expired' })
        }

        if (err instanceof CodeMismatchException || err instanceof InvalidParameterException) {

            // const attempts = await redis.get<number>(`confirm-attempts:${email}`) ?? 0;

            if (attempts == 3) {
                logger.error({ ...formatMsg(AUTH_SERVICE, AUTH_METHODS.CONFIRM), err }, 'Too many attempts.');
                return new ResponseEntity(429, { cognitoStatus: 'too-many-requests'});
            }

            logger.error({ ...formatMsg(AUTH_SERVICE, AUTH_METHODS.CONFIRM), err }, 'Confirmation code does not match.');
            return new ResponseEntity(400 , { cognitoStatus: 'code-mismatch' });
        }

        logger.error({ ...formatMsg(AUTH_SERVICE, AUTH_METHODS.CONFIRM), err }, 'Confirm error.');
        return new ResponseEntity(500, {}, "Internal server error.");
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

        logger.info(formatMsg(AUTH_SERVICE, AUTH_METHODS.RESEND_CODE), "Verification code resent successfully.");
        return  new ResponseEntity(200, { cognitoStatus: 'code-resent' });

    } catch(err) {
       
        if (err instanceof UserNotFoundException) {
            logger.error({ ...formatMsg(AUTH_SERVICE, AUTH_METHODS.RESEND_CODE), err }, 'User not found.');
            return new ResponseEntity(404, { cognitoStatus: 'user-not-found' });
        }

        // idk why im sending 'already-confirmed' - we'd never get here if its already confirmed, need to fix TODO
        if (err instanceof InvalidParameterException) {
            logger.error({ ...formatMsg(AUTH_SERVICE, AUTH_METHODS.RESEND_CODE), err }, 'Invalid Parameter or already confirmed.');
            return new ResponseEntity(400, { cognitoStatus: 'already-confirmed' });
        }

        if (err instanceof LimitExceededException || err instanceof TooManyRequestsException) {
            logger.error({ ...formatMsg(AUTH_SERVICE, AUTH_METHODS.RESEND_CODE), err }, 'Too many attempts.');
            return new ResponseEntity(429, { cognitoStatus: 'too-many-requests' });
        }

        logger.error({ ...formatMsg(AUTH_SERVICE, AUTH_METHODS.RESEND_CODE), err }, 'Resend code error.');
        return new ResponseEntity(500, {}, "Internal server error.");
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

        logger.info(formatMsg(AUTH_SERVICE, AUTH_METHODS.REFRESH), "Token refreshed successfully.");

        return new ResponseEntity(200, { access: {
            accessToken: res.AuthenticationResult?.AccessToken,
            expiresIn: res.AuthenticationResult?.ExpiresIn,
            idToken: res.AuthenticationResult?.IdToken,
            tokenType: res.AuthenticationResult?.TokenType
        }, cognitoStatus: 'authenticated' });

    } catch(err) {

        if (err instanceof NotAuthorizedException) {
            logger.error({ ...formatMsg(AUTH_SERVICE, AUTH_METHODS.REFRESH), err }, 'Session expired. Please log in again.');
            // most common - token expired or revoked, force re-login
            return new ResponseEntity(401, { cognitoStatus: 'session-expired' }, 'Session expired. Please log in again.');
        }

        if (err instanceof UserNotFoundException) {
            logger.error({ ...formatMsg(AUTH_SERVICE, AUTH_METHODS.REFRESH), err }, 'Account not found.');
            return new ResponseEntity(401, { cognitoStatus: 'user-not-found' }, 'Account not found.');
        }

        if (err instanceof TooManyRequestsException) {
            logger.error({ ...formatMsg(AUTH_SERVICE, AUTH_METHODS.REFRESH), err }, 'Too many requests. Try again later.');
            return new ResponseEntity(429, { cognitoStatus: 'too-many-requests' }, 'Too many requests. Try again later.');
        }

        if (err instanceof InvalidParameterException) {
            logger.error({ ...formatMsg(AUTH_SERVICE, AUTH_METHODS.REFRESH), err }, 'Invalid refresh token.');
            return new ResponseEntity(400, { cognitoStatus: 'invalid-token' }, 'Invalid refresh token.');
        }

        logger.error({ ...formatMsg(AUTH_SERVICE, AUTH_METHODS.REFRESH), err }, 'Token refresh error.');
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

        logger.info(formatMsg(AUTH_SERVICE, AUTH_METHODS.LOGOUT), "User logged out successfully.");
        return new ResponseEntity(200, true);
    
    } catch(err) {
        logger.error({ ...formatMsg(AUTH_SERVICE, AUTH_METHODS.LOGOUT), err }, 'Logout error.');
        return new ResponseEntity(500, false, "Internal server error.");
    }
}

export const cancel = async (email: string): Promise<ResponseEntity> => {

    try {

        await redis.del(`confirm-attempts:${ email }`);
        await redis.del(`resend-code:${ email }`);

        const cancelCount = await redis.incr(`register-cancel:${email}`);
        if (cancelCount === 1) {
            await redis.expire(`register-cancel:${email}`, 86400);
        }

        logger.info(formatMsg(AUTH_SERVICE, AUTH_METHODS.CANCEL), "Registration cancelled.");
        return new ResponseEntity(200, true);

    } catch(err) {
        logger.error({ ...formatMsg(AUTH_SERVICE, AUTH_METHODS.CANCEL), err }, 'Cancel error.');
        return new ResponseEntity(500, {}, "Internal server error.");
    }
}