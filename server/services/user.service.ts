import { Response } from "express";
import { redis } from "../utils/redis";


export const getUserById = async (id: string, res: Response) => {
    const userJson = await redis.get(id) as string;
    
    if(!userJson){
        const user = JSON.parse(userJson);
        res.status(201).json({
            success: true,
            user
        });
    }
}