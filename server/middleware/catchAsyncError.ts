import { NextFunction, Request, Response } from "express";

export const CatchAsyncError = 
(theFunc: any) => (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(theFunc(req,res,next)).catch((err: any) => next(err));
}

//used it to avoid writing try catch again and again
//function currying