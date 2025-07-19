"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const prisma_1 = require("../../../shared/prisma");
const bcrypt_1 = __importDefault(require("bcrypt"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const http_status_1 = __importDefault(require("http-status"));
const registerUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.prisma.user.findUnique({
        where: {
            email: payload === null || payload === void 0 ? void 0 : payload.email,
        },
        select: {
            email: true,
            name: true,
            image: true,
        },
    });
    if ((payload === null || payload === void 0 ? void 0 : payload.provider) === "google") {
        const data = {
            email: payload === null || payload === void 0 ? void 0 : payload.email,
            name: payload === null || payload === void 0 ? void 0 : payload.name,
            image: payload === null || payload === void 0 ? void 0 : payload.image,
        };
        if (!user) {
            const result = yield prisma_1.prisma.user.create({
                data: data,
                select: {
                    email: true,
                    name: true,
                    image: true,
                },
            });
            return result;
        }
        return user;
    }
    else {
        if (user) {
            throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Already registered. Please login/continue with google.");
        }
        const hashedPassword = yield bcrypt_1.default.hash(payload === null || payload === void 0 ? void 0 : payload.password, 12);
        payload["password"] = hashedPassword;
        const result = yield prisma_1.prisma.user.create({
            data: payload,
            select: {
                email: true,
                name: true,
                image: true,
            },
        });
        return result;
    }
});
const loginUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prisma_1.prisma.user.findUnique({
        where: {
            email: payload.email,
        },
    });
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Please register first!");
    }
    const isPasswordMatched = yield bcrypt_1.default.compare(payload.password, user === null || user === void 0 ? void 0 : user.password);
    if (!isPasswordMatched) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Wrong password!");
    }
    return {
        email: user === null || user === void 0 ? void 0 : user.email,
        name: user === null || user === void 0 ? void 0 : user.name,
        image: user === null || user === void 0 ? void 0 : user.image,
    };
});
exports.AuthService = {
    registerUser,
    loginUser,
};
