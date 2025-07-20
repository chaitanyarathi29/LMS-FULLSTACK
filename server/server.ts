import { app } from "./app";
import dotenv from 'dotenv';
import { connectToDB } from "./utils/db";
dotenv.config();


app.listen(process.env.PORT, () => {
    console.log(`server started at port ${process.env.PORT}`)
    connectToDB();
})