import status from "http-status";
import { catchAsync } from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";
import { UserService } from "./user.service";
import config from "../../../config";
import pick from "../../../shared/pick";
import { userFilterableFields } from "./user.constant";

const registerUser = catchAsync(async (req, res) => {
  const { accessToken, refreshToken } = await UserService.registerUser(
    req.body
  );

  res.cookie("refreshToken", refreshToken, {
    secure: config.env === "production",
    httpOnly: true,
    sameSite: config.env === "production" ? "none" : "strict",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });

  sendResponse(res, {
    success: true,
    statusCode: status.CREATED,
    message: "User registered successfully.",
    data: {
      accessToken,
      refreshToken,
    },
  });
});

const loginUser = catchAsync(async (req, res) => {
  const { accessToken, refreshToken } = await UserService.loginUser(req.body);

  res.cookie("refreshToken", refreshToken, {
    secure: config.env === "production",
    httpOnly: true,
    sameSite: config.env === "production" ? "none" : "strict",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  });

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "User login successfully.",
    data: {
      accessToken,
      refreshToken,
    },
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;
  const result = await UserService.refreshToken(refreshToken);
  sendResponse(res, {
    success: true,
    statusCode: status.CREATED,
    message: "Access Token generated successfully.",
    data: {
      accessToken: result,
    },
  });
});

const getAllUser = catchAsync(async (req, res) => {
  const filters = pick(req.query, userFilterableFields);
  const options = pick(req.query, ["limit", "page"]);
  const result = await UserService.getAllUser(filters, options);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Users data retrived successfully",
    data: result?.data,
    meta: result?.meta,
  });
});

const roleUpdate = catchAsync(async (req, res) => {
  const result = await UserService.roleUpdate(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "User role updated successfully",
    data: result,
  });
});

const statusUpdate = catchAsync(async (req, res) => {
  const result = await UserService.statusUpdate(req.params.id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "User status updated successfully",
    data: result,
  });
});

export const UserController = {
  registerUser,
  loginUser,
  refreshToken,
  getAllUser,
  roleUpdate,
  statusUpdate,
};
