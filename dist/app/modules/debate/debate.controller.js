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
exports.DebateController = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = require("../../../shared/catchAsync");
const sendResponse_1 = require("../../../shared/sendResponse");
const debate_service_1 = require("./debate.service");
const createDebate = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield debate_service_1.DebateService.createDebate(req.body);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Debate created successfully",
        data: result,
    });
}));
const getAllDebates = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield debate_service_1.DebateService.getAllDebates(req.query);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Debates fetched successfully",
        data: result,
    });
}));
const joinDebate = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { debateId, side, email } = req.body;
    const result = yield debate_service_1.DebateService.joinDebate(debateId, side, email);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Joined debate successfully",
        data: result,
    });
}));
const postArgument = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { debateId, content, side, userEmail } = req.body;
    const result = yield debate_service_1.DebateService.postArgument(userEmail, debateId, content, side);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Argument posted successfully",
        data: result,
    });
}));
const editArgument = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield debate_service_1.DebateService.editArgument(req.body);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Argument updated successfully",
        data: result,
    });
}));
const voteArgument = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { argumentId, email } = req.body;
    const result = yield debate_service_1.DebateService.voteArgument(email, argumentId);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.CREATED,
        message: "Vote added successfully",
        data: result,
    });
}));
const getDebateDetails = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield debate_service_1.DebateService.getDebateDetails(req.params.id, req.params.email);
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Debate details retrieved",
        data: result,
    });
}));
const getScoreboard = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const filter = req.query.filter;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const result = yield debate_service_1.DebateService.getScoreboard({ filter, page, limit });
    (0, sendResponse_1.sendResponse)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Scoreboard fetched successfully",
        meta: result.meta,
        data: result.data,
    });
}));
exports.DebateController = {
    createDebate,
    joinDebate,
    postArgument,
    voteArgument,
    getDebateDetails,
    getAllDebates,
    getScoreboard,
    editArgument,
};
