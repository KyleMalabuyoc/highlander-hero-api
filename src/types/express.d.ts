import { CognitoAccessTokenPayload } from "aws-jwt-verify/jwt-model";

// merge this into the global scope
declare global {
    namespace Express {
        interface Request {
            user?: CognitoAccessTokenPayload
        }
    }
}