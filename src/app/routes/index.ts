import express from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { DebateRoutes } from "../modules/debate/debate.route";

const router = express.Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/debates",
    route: DebateRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
