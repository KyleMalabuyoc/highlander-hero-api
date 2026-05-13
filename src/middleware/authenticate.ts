import { Request, NextFunction, Response } from "express";
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { JwtParseError } from "aws-jwt-verify/error";

export const validateAccess = async (req: Request, res: Response, next: NextFunction) => {

    const accessToken = req.headers.authorization?.split(' ')[1] ?? '';

    try {

       const verifier = CognitoJwtVerifier.create({
        userPoolId: process.env.AWS_USER_POOL_ID ?? '',
        tokenUse: 'access',
        clientId: process.env.AWS_COGNITO_CLIENT_ID ?? ''
       });

       req.user = await verifier.verify(accessToken);

       next();

    } catch(err) {

        if (err instanceof JwtParseError) {
            console.error(err);
        }

        return res.status(401).json({ status: 401, message: "Invalid access token." });
    }


    /**
     * 
     * Flow here for verifying
     * 
     * Grab the bearer token
     * 
     * decode the JWT to access the kid
     * 
     * grab JWKS to verify the kid in the JWT with whats in cognito
     * 
     * store resulting http response from JWKS in memory using maybe jwks-rsa
     * 
     * verify that the JWT was signed from cognito using the public key mapped to the kid
     * 
     * authentictaed - extract sub, and username (email)
     *
     * 
     * JWT is essentially the cache storing our information 
     * so no need to store sub and username in cache BUT storing full user info in cache might be helpful
     * 
     * just need to use req.user( sub, email ) and then next()
     * 
     */
}