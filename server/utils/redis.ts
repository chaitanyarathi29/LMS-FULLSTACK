import {Redis} from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = () => {
    if(process.env.REDIS_URI){
        console.log(`Redis connected`);
        return process.env.REDIS_URI
    }
    throw new Error(`Redis connected failed`);
};

export const redis = new Redis(redisClient());