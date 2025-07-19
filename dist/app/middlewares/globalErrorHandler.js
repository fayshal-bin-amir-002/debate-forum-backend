"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const http_status_1 = __importDefault(require("http-status"));
const config_1 = __importDefault(require("../../config"));
const client_1 = require("@prisma/client");
const globalErrorHandler = (err, req, res, next) => {
    var _a;
    let statusCode = http_status_1.default.INTERNAL_SERVER_ERROR;
    let message = (err === null || err === void 0 ? void 0 : err.message) || "Something went wrong!";
    let errorSources = [
        {
            path: "",
            message: message,
        },
    ];
    // Prisma validation error
    if (err instanceof client_1.Prisma.PrismaClientValidationError) {
        statusCode = http_status_1.default.BAD_REQUEST;
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
    else if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        statusCode = http_status_1.default.BAD_REQUEST;
        message = "Prisma request error.";
        errorSources = [
            {
                path: "",
                message: ((_a = err.meta) === null || _a === void 0 ? void 0 : _a.cause) || err.message,
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
        error: config_1.default.env === "development" ? err : undefined,
    });
};
exports.globalErrorHandler = globalErrorHandler;
