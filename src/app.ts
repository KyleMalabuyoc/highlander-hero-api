import express from 'express';
import cors from 'cors';
import router from './routes/routes.js';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import { pinoHttp } from 'pino-http';
import { autologging, logger, customHTTPSerializer } from './config/logger/pino.js';

const app = express();
app.disable('x-powered-by');

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

const corsOptions = {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
};

app.set('trust proxy', 1);

app.use(pinoHttp({
    logger,
    serializers: customHTTPSerializer,
    autoLogging: autologging
}));

app.use((_req, res, next) => {

    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    res.setHeader('X-DNS-Prefetch-Control', 'off');
    res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()');

    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    next();
});

app.use(express.json({ limit: process.env.MAX_PAYLOAD_SIZE })); // limit the size of each payload to avoid overloading server memory
app.use(cors(corsOptions));
app.use(cookieParser()) // cookie parser middleware to be able to grab cookies when they get to server
app.use('/api/v1', router);

app.listen(process.env.PORT, (err) => {
    if (err) console.log(err);
    console.log("Server runnning on port...", process.env.PORT);
});