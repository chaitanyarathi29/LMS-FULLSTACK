import { Request, Response, NextFunction } from "express"; 
import userModel, {IUser} from "../models/user.model";
import { ErrorHandler } from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config(); 
import ejs from 'ejs';
import path from 'path';
import sendMail from "../utils/sendMail";
import { sendToken } from "../utils/jwt";

interface IRegistrationBody{
    name: string;
    email: string;
    password: string;
    avatar?: string;
}

export const registrationUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;

        const isEmailExist = await userModel.findOne({email});
        if(isEmailExist){
            return next(new ErrorHandler("email already exists",400));
        };

        const user: IRegistrationBody = {
            name,
            email,
            password
        };

        const activationToken = createActivationToken(user);

        const activationCode = activationToken.activationCode;

        const data = {user: {name: user.name}, activationCode};
        const html = await ejs.renderFile(path.join(__dirname, "../mails/activation-mail.ejs"),data);

        try {
            await sendMail({
                email: user.email,
                subject: "Activate your account",
                template:"activation-mail.ejs",
                data
            })
        } catch (error: any) {
            return next(new ErrorHandler(error.message,400))
        }

        res.status(201).json({
            success: true,
            activationToken: activationToken
        })

    } catch (error: any) {
        return next(new ErrorHandler(error.message,400))
    }
});

interface IActivationRequest{
    activation_token: string,
    activation_code: string
}

export const activateUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
       const {activation_token, activation_code} = req.body as IActivationRequest;
       
       const newUser: {user: IUser, activationCode: string} = jwt.verify(
            activation_token,
            process.env.JWT_SECRET as string
        ) as {
            user: IUser; activationCode: string
        };

        if(newUser.activationCode !== activation_code){
            return next(new ErrorHandler("Invalid activation code",400));
        }

        const {name, email, password} = newUser.user;

        const existUser = await userModel.findOne({email});

        if(existUser){
            return next(new ErrorHandler("Email already exist",400));
        }

        const user = await userModel.create({
            name,
            email,
            password,
        });

        res.status(201).json({
            success: true,
        })

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
})

interface IActivationToken{
    token: string;
    activationCode: string;
}

const createActivationToken = (user: IRegistrationBody): IActivationToken => {
    const activationCode = Math.floor(1000 + Math.random()*9000).toString();

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        throw new Error("JWT_SECRET environment variable is not defined");
    }

    const token = jwt.sign({
        user,
        activationCode
    }, jwtSecret,{expiresIn: '5m'});

    return {
        token,
        activationCode
    };
}

interface ILoginRequest {
    email: string;
    password: string;
}

export const loginUser = CatchAsyncError(async(req: Request, res: Response, next: NextFunction) => {

    try {
        
        const {email, password} = req.body as ILoginRequest;

        if(!email || !password){
            return next(new ErrorHandler("Please enter email and password",400));
        }

        const user = await userModel.findOne({email}).select('+password');

        if(!user){
            return next(new ErrorHandler("Invalid email or password",400));
        }

        const passwordMatch = await user.comparePassword(password);
        
        if(!passwordMatch){
            return next(new ErrorHandler("Password is invalid",400));
        }

        sendToken(user,200,res);

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
}) 

export const logoutUser = CatchAsyncError(async(req: Request, res: Response, next: NextFunction) => {
    try {
        res.cookie("access_token", "", { maxAge: 1});
        res.cookie("refresh_token","",{maxAge: 1});
        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
    }
});

