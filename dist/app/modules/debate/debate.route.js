"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebateRoutes = void 0;
const express_1 = __importDefault(require("express"));
const debate_controller_1 = require("./debate.controller");
const router = express_1.default.Router();
router.post("/create", debate_controller_1.DebateController.createDebate);
router.get("/", debate_controller_1.DebateController.getAllDebates);
router.post("/join", debate_controller_1.DebateController.joinDebate);
router.post("/post-argument", debate_controller_1.DebateController.postArgument);
router.patch("/edit-argument", debate_controller_1.DebateController.editArgument);
router.post("/vote", debate_controller_1.DebateController.voteArgument);
router.get("/details/:id/:email", debate_controller_1.DebateController.getDebateDetails);
router.get("/score-board", debate_controller_1.DebateController.getScoreboard);
exports.DebateRoutes = router;
