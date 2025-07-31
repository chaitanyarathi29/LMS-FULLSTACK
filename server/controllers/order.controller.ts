import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import { IOrder } from "../models/order.model";
import userModel from "../models/user.model";
import { ErrorHandler } from "../utils/ErrorHandler";
import CourseModel from "../models/course.model";
import { newOrder } from "../services/order.services";
import ejs from 'ejs';
import path from 'path';
import sendMail from "../utils/sendMail";
import { NotificationModel } from "../models/notificationModel";
import mongoose from "mongoose";


export const createOrder = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {courseId, payment_info} = req.body as IOrder;

        const user = await userModel.findById(req.user?._id);

        const courseExistsInUser = user?.courses.some((course: any) => course._id.toString() === courseId);

        if(courseExistsInUser){
            return next(new ErrorHandler("You have already purchased this course", 400));
        }

        console.log(courseId);

        if (!mongoose.Types.ObjectId.isValid(courseId)) {
            return next(new ErrorHandler("Invalid course ID format", 400));
        }

        const course = await CourseModel.findById(courseId);

        if(!course){
            return next(new ErrorHandler("Course not found",404));
        }

        const data: any = {
            courseId: course?._id,
            userId: user?._id,
            payment_info
        };

        newOrder(data,res,next);

        const mailData = {
            order: {
                _id: course?._id?.toString().slice(0,6),
                name: course.name,
                price: course.price,
                date: new Date().toLocaleDateString('en-US', {year: 'numeric', month: 'long', day: 'numeric'}),
            }
        }

        const html = await ejs.renderFile(path.join(__dirname,'../mails/confirmation-mail.ejs'),{order:mailData});

        try {
            if(user){
                await sendMail({
                    email: user.email,
                    subject: "Order Confirmation",
                    template: "confirmation-mail.ejs",
                    data: mailData,
                });
            }
        } catch (error: any) {
            next(new ErrorHandler(error.message,500));
        }
    
        if (course?._id) {
            user?.courses.push({ courseId: course._id.toString() });
        } else {
            return next(new ErrorHandler("Course ID is undefined", 500));
        }

        await user?.save();

        await NotificationModel.create({
            user: user?._id,
            title: 'New Order',
            message: `You have a new order from ${course?.name}`
        });

        if(course.purchased){
            course.purchased += 1;
        }
        
        await user?.save();

        newOrder(data,res,next);

    } catch (error: any) {
        return next(new ErrorHandler(error.message,500));
    }
})