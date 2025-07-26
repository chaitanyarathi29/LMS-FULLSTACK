import dotenv from 'dotenv';
dotenv.config();
import { Response } from 'express';
import { IUser } from '../models/user.model';
import { redis } from './redis';


interface ITokenOptions {
    expires:Date;
    maxAge:number;
    httpOnly:boolean;
    sameSite: 'lax' | 'strict' | 'none' | undefined;
    secure?: boolean;
}
    export const accessTokenExpire = parseInt(process.env.ACCESS_TOKEN_EXPIRE || '5', 10);
    export const refreshTokenExpire = parseInt(process.env.REFRESH_TOKEN_EXPIRE || '3', 10);

    //options for cookies

    export const accessTokenOptions: ITokenOptions = {
        expires: new Date(Date.now() + accessTokenExpire * 60 * 60 * 1000),
        maxAge: accessTokenExpire * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
    }

    export const refreshTokenOptions: ITokenOptions = {
        expires: new Date(Date.now() + refreshTokenExpire * 24 * 60 * 60 * 1000),
        maxAge: refreshTokenExpire * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
    }

export const sendToken = async (user: IUser, statusCode: number, res:Response) => {
    const accessToken = user.SignAccessToken();
    const refreshToken = user.SignRefreshToken();

    // upload session to redis
    await redis.set(String(user._id) ,JSON.stringify(user) as any)

    //only set secure to true in production
    if(process.env.NODE_ENV === 'production'){
        accessTokenOptions.secure = true;
    }

    //Ensures secure: true is set in production so cookies are only sent over HTTPS.

    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);

    res.status(statusCode).json({
        success: true,
        user,
        accessToken,
    })

}


