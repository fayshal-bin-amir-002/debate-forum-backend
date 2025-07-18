import { NextFunction, Request, Response } from "express";
import status from "http-status";
import config from "../../config";
import { TErrorSources } from "../interfaces/error";
import { ZodError } from "zod";
import handleZodError from "../errors/handleZodError";
import { Prisma } from "@prisma/client";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode: number = status.INTERNAL_SERVER_ERROR;
  let message = err?.message || "Something went wrong!";
  let errorSources: TErrorSources = [
    {
      path: "",
      message: message,
    },
  ];

  // Zod validation error
  if (err instanceof ZodError) {
    const simplifiedError = handleZodError(err);
    statusCode = simplifiedError.statusCode;
    message = simplifiedError.message;
    errorSources = simplifiedError.errorSources;
  }

  // Prisma validation error
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = status.BAD_REQUEST;
    message = "Prisma validation error. Check your input.";
    const cleanedMessage = err.message.split("\n").slice(-1)[0].trim();
    errorSources = [
      {
        path: "",
        message: cleanedMessage,
      },
    ];
  }

  // Prisma known request error (e.g., unique constraint violation)
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = status.BAD_REQUEST;
    message = "Prisma request error.";
    errorSources = [
      {
        path: "",
        message: (err.meta?.cause as string) || err.message,
      },
    ];
  }

  // Other application-defined errors (optional)
  else if (err.statusCode && err.message) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = err.errorSources || errorSources;
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    error: config.env === "development" ? err : undefined,
  });
};
