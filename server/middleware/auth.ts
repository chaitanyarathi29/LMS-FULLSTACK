import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "./catchAsyncError";
import { ErrorHandler } from "../utils/ErrorHandler";
import dotenv from 'dotenv';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { redis } from "../utils/redis";
import { accessTokenOptions, refreshTokenOptions } from "../utils/jwt";
import { getUserById } from "../services/user.service";
dotenv.config();

export const isAuthenticated = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token as string;

    if(!access_token){
        return next(new ErrorHandler("Please login to access this resource",400));
    }

    const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;
    if(!decoded){
        return next(new ErrorHandler("access token is not valid",400));
    }

    const user = await redis.get(decoded.id);

    if(!user){
        return next(new ErrorHandler("user not found",400));
    }

    req.user = JSON.parse(user);

    next();
})

export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if(!roles.includes(req.user?.role || '')){
            return next(new ErrorHandler(`Role ${req.user?.role} is not allowed to access this resource`, 403));
        }
        next();
    }
}

export const updateAccessToken = CatchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
    try {
        const refresh_token = req.cookies.refresh_token as string;
        const decoded = jwt.verify(refresh_token, process.env.REFRESH_TOKEN as string) as JwtPayload;

        if(!decoded){
            return  next(new ErrorHandler("refresh token is invalid",400));
        }
        const session = await redis.get(decoded.id) as string;

        if(!session){
            return next(new ErrorHandler("could not refresh token",400));
        }

        const user = JSON.parse(session);

        const accessToken = jwt.sign({id: user._id}, process.env.ACCESS_TOKEN as string,{
            expiresIn: '5m'
        });

        const refreshToken = jwt.sign({id: user._id}, process.env.REFRESH_TOKEN as string,{
            expiresIn: '3d'
        });

        req.user = user;

        res.cookie("access_token",accessToken,accessTokenOptions);
        res.cookie("refresh_token",refreshToken,refreshTokenOptions);

        res.status(200).json({
            status: "success",
            accessToken
        })

    } catch (error: any) {
        return next(new ErrorHandler(error.message,400));
    } 
})