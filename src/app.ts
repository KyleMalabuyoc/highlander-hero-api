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
app.use(cors(corsOptions));
app.use(express.json()); // JSON deserializer for incoming requests only
app.use(cookieParser()) // cookie parser middleware to be able to grab cookies when they get to server
app.use('/api/v1', router);

app.listen(process.env.PORT, (err) => {
    if (err) console.log(err);
    console.log("Server runnning on port...", process.env.PORT);
});
