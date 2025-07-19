"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendResponse = void 0;
const sendResponse = (res, jsonData) => {
    res.status(jsonData.statusCode).json({
        success: jsonData.success,
        message: jsonData.message,
        data: jsonData === null || jsonData === void 0 ? void 0 : jsonData.data,
        meta: jsonData === null || jsonData === void 0 ? void 0 : jsonData.meta,
    });
};
exports.sendResponse = sendResponse;
