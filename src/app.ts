import express from 'express';
import cors from 'cors';
import router from './routes/authRoutes.js';
import 'dotenv/config';

const app = express();
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];

const corsOptions = {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(express.json()); // deserializer
app.use('/api/v1', router);

app.listen(process.env.PORT, (err) => {
    if (err) console.log(err);
    console.log("Server runnning on port...", process.env.PORT);
});
