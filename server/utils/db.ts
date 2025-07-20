import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();
export const connectToDB = async () => {

    const dbUrl = process.env.DB_URI ?? "";

    try {
        await mongoose.connect(dbUrl).then((data) => {
            console.log(`database connected with ${data.connection.host}`)
        })
    } catch (error: any) {
        console.log(error.message);
        setTimeout(connectToDB,5000);
    }
}