import cookieParser from 'cookie-parser';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { diffErrors } from './middleware/error';



export const app = express();
dotenv.config();

interface error{
    statusCode?: number
}

app.use(express.json({limit: '50mb'}));

app.use(cookieParser());

app.use(cors({
    origin: process.env.ORIGIN
}));

app.get('/test', (req:Request, res: Response) => {
    res.status(201).json({
        message: 'hi!'
    })
})

app.all('*', (req:Request, res: Response, next: NextFunction) => {
    const err = new Error(`Route ${req.originalUrl} not found`) as error;
    err.statusCode = 404;
    next(err);
})

app.use(diffErrors);