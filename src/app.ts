import express, { Application, Request, Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./app/routes";
import { globalErrorHandler } from "./app/middlewares/globalErrorHandler";
import { notFoundRoute } from "./app/middlewares/notFoundRoute";

const app: Application = express();

app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.use("/api/v1", router);

const getAController = async (req: Request, res: Response) => {
  res.send({
    status: "success",
    message: "Debate server is running...",
  });
};

app.get("/", getAController);

app.use(globalErrorHandler);

app.use(notFoundRoute);

export default app;
