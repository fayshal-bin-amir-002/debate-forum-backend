import express from "express";
import { DebateController } from "./debate.controller";

const router = express.Router();

router.post("/create", DebateController.createDebate);

router.get("/", DebateController.getAllDebates);

router.post("/join", DebateController.joinDebate);

router.post("/post-argument", DebateController.postArgument);

router.patch("/edit-argument", DebateController.editArgument);

router.post("/vote", DebateController.voteArgument);

router.get("/details/:id/:email", DebateController.getDebateDetails);

router.get("/score-board", DebateController.getScoreboard);

export const DebateRoutes = router;
