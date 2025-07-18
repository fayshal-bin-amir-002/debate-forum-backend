import status from "http-status";
import { catchAsync } from "../../../shared/catchAsync";
import { sendResponse } from "../../../shared/sendResponse";
import { AuthService } from "./auth.service";

const registerUser = catchAsync(async (req, res) => {
  const result = await AuthService.registerUser(req.body);

  sendResponse(res, {
    success: true,
    statusCode: status.CREATED,
    message: "User register successfully.",
    data: result,
  });
});

const loginUser = catchAsync(async (req, res) => {
  const result = await AuthService.loginUser(req.body);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "User logged in successfully.",
    data: result,
  });
});

export const AuthController = {
  registerUser,
  loginUser,
};
