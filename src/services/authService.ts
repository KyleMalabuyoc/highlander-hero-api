import { Request } from "express";
import { LoginInfo } from "../types/LoginInfo.js";
import { dummyLoginResponse } from "../temp/dummyData.js";
import { AdminGetUserCommand, CodeMismatchException, CognitoIdentityProviderClient, ConfirmSignUpCommand, ExpiredCodeException, InvalidParameterException, LimitExceededException, ResendConfirmationCodeCommand, SignUpCommand, TooManyRequestsException, UsernameExistsException, UserNotFoundException } from "@aws-sdk/client-cognito-identity-provider";
import 'dotenv/config';
import { RegisterInfo } from "../types/RegisterInfo.js";
import { db } from "../config/db.js";
import { users } from "../config/schema.js";
import { ResponseEntity } from "../types/ResponseEntity.js";
import { RegisterResponse } from "../types/responses/CognitoResponse.js";
import redis from "../config/redis.js";
// need to take care of unhappy cases as well

const client = new CognitoIdentityProviderClient({});

export const login = (req: Request): LoginInfo => {
    return dummyLoginResponse;
}

export const register = async (req: Request): Promise<ResponseEntity> => {

    const registrationInfo: RegisterInfo = req.body;

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

        if (err instanceof UsernameExistsException) {

            const user = await client.send(new AdminGetUserCommand({
                UserPoolId: process.env.AWS_USER_POOL_ID,
                Username: registrationInfo.email
            }));

            if (user.UserStatus === 'CONFIRMED') {
                return new ResponseEntity(400, { message: 'An account with this email already exists.', cognitoStatus: 'account-exists'});
            }

            // check cache first to see if user is locked out for 24 hours
            // if so, dont send the code
            const attempts = await redis.get<number>(`confirm-attempts:${registrationInfo.email}`) ?? 0;

            if (attempts >= 3) {
                return new ResponseEntity(429, { cognitoStatus: 'too-many-requests'});
            }

            // in the scenario that the user exceeds the amount of times allowed for a code entry

            if (user.UserStatus === 'UNCONFIRMED') {

                const result = await client.send(new ResendConfirmationCodeCommand({
                    ClientId: process.env.AWS_COGNITO_CLIENT_ID,
                    Username: registrationInfo.email
                }));

                return new ResponseEntity(200, { message: "Registration successful. Check your email for a verification code.", destination: result.CodeDeliveryDetails?.Destination, cognitoStatus: 'confirm-code' })
            }
        }

        return new ResponseEntity(500, {}, "Internal server error: " + err);
    }
}

// confirm registration code
export const confirm = async (req: Request): Promise<ResponseEntity> => {

    const { email, code } = req.body;

    const command = new ConfirmSignUpCommand({
        ClientId: process.env.AWS_COGNITO_CLIENT_ID,
        Username: email,
        ConfirmationCode: code
    });

    // grab current amount of attempts from cache
    const attempts = await redis.incr(`confirm-attempts:${email}`).catch(err => new ResponseEntity(500, {}, "Internal server error." + err));

    // TODO: maybe global exception handler -> generic
    try {

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

export const resendCode = async (req: Request): Promise<ResponseEntity> => {

    const { email } = req.body;

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

        if (resends > 2) {
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

export const refresh = (req: Request): LoginInfo => {
    return dummyLoginResponse;
}

export const logout = (req: Request): LoginInfo => {
    return dummyLoginResponse;
}