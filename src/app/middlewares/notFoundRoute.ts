import { NextFunction, Request, Response } from "express";
import status from "http-status";

export const notFoundRoute = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.status(status.NOT_FOUND).json({
    success: false,
    message: "Route Not Found",
    error: {
      path: req.originalUrl,
      statusCode: status.NOT_FOUND,
      message: "Route Not Found",
    },
  });
  next();
};
