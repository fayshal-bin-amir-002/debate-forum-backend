"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundRoute = void 0;
const http_status_1 = __importDefault(require("http-status"));
const notFoundRoute = (req, res, next) => {
    res.status(http_status_1.default.NOT_FOUND).json({
        success: false,
        message: "Route Not Found",
        error: {
            path: req.originalUrl,
            statusCode: http_status_1.default.NOT_FOUND,
            message: "Route Not Found",
        },
    });
    next();
};
exports.notFoundRoute = notFoundRoute;
