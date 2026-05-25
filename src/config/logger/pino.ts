import { Request, Response } from "express";
import pino, { SerializedRequest, SerializedResponse } from "pino";

// this config is used for the log level, timestamp format, redact, transport (how logs are output)
export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
    // serializers: { // only use this if you want a consisten format for all the logs
    //     info: (val: any) => {}
    // },
    base: undefined // can use this to add our own custom properties to the logs
});

// controls which automatic requests get logged
export const autologging = {
    ignore: (req: Request) => req.method === 'OPTIONS'
}

// only for HTTP req/res shape
export const customHTTPSerializer = {
    req: (req: SerializedRequest) => ({ // known hooks, along with res and err. Serializers only apply to these
        method: req.method,
        url: req.url,
        userId: 'need this',
        headers: {
            host: req.headers.host,
            transactionId: req.headers['transaction-id']
        }
    }),
    res: (res: SerializedResponse) => ({
        method: res.raw.req.method,
        url: res.raw.req.url,
        userId: 'need this',
        headers: {
            host: res.raw.req.headers.host,
            transactionId: res.raw.req.headers['transaction-id']
        }
    })

    // we can add other logs like request body response body within the code itself
}

/**
 * 
 * Note - pino-http passes a partially serialized res object to the serializer, not the full Express response — so some methods like getHeader aren't available.
 */