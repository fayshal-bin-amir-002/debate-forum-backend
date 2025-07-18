import { NextFunction, Request, Response } from "express";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import config from "../../config";
import status from "http-status";
import ApiError from "../errors/ApiError";

const auth = (...roles: string[]) => {
  return async (
    req: Request & { user?: any },
    res: Response,
    next: NextFunction
  ) => {
    try {
      const token = req.headers.authorization;

      if (!token) {
        throw new ApiError(status.UNAUTHORIZED, "You are not authorized");
      }

      const verifiedUser = jwtHelpers.verifyToken(
        token,
        config.jwt.jwt_access_token_secret as string
      );

      req.user = verifiedUser;

      if (roles.length && !roles.includes(verifiedUser?.role)) {
        throw new ApiError(status.FORBIDDEN, "Forbidden access");
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};

export default auth;
