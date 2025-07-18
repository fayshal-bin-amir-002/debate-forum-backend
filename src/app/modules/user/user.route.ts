import express from "express";
import { UserController } from "./user.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import {
  registerUserZodSchema,
  roleZodSchema,
  statusZodSchema,
} from "./user.validation";
import auth from "../../middlewares/auth";
import { UserRole } from "@prisma/client";

const router = express.Router();

router.post(
  "/register",
  validateRequest(registerUserZodSchema),
  UserController.registerUser
);

router.post(
  "/login",
  validateRequest(registerUserZodSchema),
  UserController.loginUser
);

router.post("/refreshToken", UserController.refreshToken);

router.get("/", auth(UserRole.ADMIN), UserController.getAllUser);

router.patch(
  "/update-role/:id",
  validateRequest(roleZodSchema),
  auth(UserRole.ADMIN),
  UserController.roleUpdate
);

router.patch(
  "/update-status/:id",
  validateRequest(statusZodSchema),
  auth(UserRole.ADMIN),
  UserController.statusUpdate
);

export const UserRoutes = router;
