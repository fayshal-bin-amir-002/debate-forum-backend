import status from "http-status";
import { catchAsync } from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";
import { DebateService } from "./debate.service";

const createDebate = catchAsync(async (req, res) => {
  const result = await DebateService.createDebate(req.body);
  sendResponse(res, {
    success: true,
    statusCode: status.CREATED,
    message: "Debate created successfully",
    data: result,
  });
});

const getAllDebates = catchAsync(async (req, res) => {
  const result = await DebateService.getAllDebates();

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Debates fetched successfully",
    data: result,
  });
});

const joinDebate = catchAsync(async (req, res) => {
  const { debateId, side } = req.body;
  const result = await DebateService.joinDebate(req.user.email, debateId, side);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Joined debate successfully",
    data: result,
  });
});

const postArgument = catchAsync(async (req, res) => {
  const { debateId, content, side } = req.body;
  const result = await DebateService.postArgument(
    req.user.email,
    debateId,
    content,
    side
  );
  sendResponse(res, {
    success: true,
    statusCode: status.CREATED,
    message: "Argument posted successfully",
    data: result,
  });
});

const voteArgument = catchAsync(async (req, res) => {
  const { argumentId } = req.body;
  const result = await DebateService.voteArgument(req.user.email, argumentId);
  sendResponse(res, {
    success: true,
    statusCode: status.CREATED,
    message: "Vote added successfully",
    data: result,
  });
});

const getDebateDetails = catchAsync(async (req, res) => {
  const { debateId } = req.params;
  const result = await DebateService.getDebateDetails(debateId);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Debate details retrieved",
    data: result,
  });
});

export const DebateController = {
  createDebate,
  joinDebate,
  postArgument,
  voteArgument,
  getDebateDetails,
  getAllDebates,
};
