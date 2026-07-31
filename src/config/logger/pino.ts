import { Request, Response } from "express";
import pino from "pino";
import { AsyncLocalStorage } from "async_hooks";

const store = new AsyncLocalStorage<{ userId: number }>();

// this is the function we call to store whatever value we want in the store.
export const runWithContext = (userId: number, fn: () => void) => {
    store.run({ userId }, fn);
}

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
    req: (req: Request) => (
        {
            method: req.method,
            url: req.url,
            transactionId: req.headers['transaction-id']
        }
    ),
    res: (res: Response) => ({
        statusCode: res.statusCode,
        // responseTime: res.raw?.[startTime]  // how long it took
    })

    // we can add other logs like request body response body within the code itself
}

/**
 * 
 * Note - pino-http passes a partially serialized res object to the serializer, not the full Express response — so some methods like getHeader aren't available.
 */

export const formatMsg = (source: string, method: string) => {
    const userId = store.getStore()?.userId ?? -1;
    return { userId, source, method };
}