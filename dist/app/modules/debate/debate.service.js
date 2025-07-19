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
exports.DebateService = void 0;
const prisma_1 = require("../../../shared/prisma");
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const http_status_1 = __importDefault(require("http-status"));
const debate_interface_1 = require("./debate.interface");
const createDebate = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const userEmail = payload === null || payload === void 0 ? void 0 : payload.userEmail;
    const user = yield prisma_1.prisma.user.findUnique({
        where: {
            email: userEmail,
        },
    });
    if (!user) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "User not exists");
    }
    const endsAt = new Date(Date.now() + payload.duration * 60 * 60 * 1000); // duration in hours
    const result = yield prisma_1.prisma.debate.create({
        data: {
            title: payload.title,
            description: payload.description,
            tags: payload.tags,
            category: payload.category,
            duration: payload.duration,
            authorEmail: userEmail,
            endsAt,
        },
    });
    return result;
});
const getAllDebates = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (params = {}) {
    const { searchTerm, sortBy } = params;
    const now = new Date();
    const baseWhere = searchTerm
        ? {
            OR: [
                {
                    title: {
                        contains: searchTerm,
                        mode: "insensitive",
                    },
                },
                {
                    category: {
                        contains: searchTerm,
                        mode: "insensitive",
                    },
                },
                {
                    tags: {
                        has: searchTerm,
                    },
                },
            ],
        }
        : {};
    // Filter for "endingSoon"
    if (sortBy === "endingSoon") {
        baseWhere.endsAt = {
            gt: now,
        };
    }
    const debates = yield prisma_1.prisma.debate.findMany({
        where: baseWhere,
        select: {
            id: true,
            title: true,
            createdAt: true,
            endsAt: true,
            category: true,
            duration: true,
            tags: true,
            author: {
                select: {
                    name: true,
                    email: true,
                    image: true,
                },
            },
            arguments: {
                select: {
                    _count: {
                        select: {
                            votes: true,
                        },
                    },
                },
            },
        },
        orderBy: sortBy === "mostVoted"
            ? {
                createdAt: "desc",
            }
            : sortBy === "endingSoon"
                ? {
                    endsAt: "asc",
                }
                : {
                    createdAt: "desc",
                },
    });
    return debates.map((debate) => {
        const totalVotes = debate.arguments.reduce((sum, arg) => sum + arg._count.votes, 0);
        return {
            id: debate.id,
            title: debate.title,
            authorName: debate.author.name,
            authorEmail: debate.author.email,
            authorImage: debate.author.image,
            category: debate.category,
            duration: debate.duration,
            tags: debate.tags,
            voteCount: totalVotes,
            status: now < debate.endsAt ? "Running" : "Ended",
        };
    });
});
const joinDebate = (debateId, side, userEmail) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield prisma_1.prisma.argument.findFirst({
        where: {
            userEmail,
            debateId,
        },
    });
    if (existing) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `You already joined this debate in ${existing === null || existing === void 0 ? void 0 : existing.side} side.`);
    }
    const debate = yield prisma_1.prisma.debate.findUnique({
        where: {
            id: debateId,
        },
    });
    if (!debate) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Debate not found");
    }
    const isClosed = new Date() > debate.endsAt;
    if (isClosed) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Cannot join. Debate is closed.");
    }
    return yield prisma_1.prisma.argument.create({
        data: {
            userEmail,
            debateId,
            side,
            content: "",
        },
    });
});
const postArgument = (userEmail, debateId, content, side) => __awaiter(void 0, void 0, void 0, function* () {
    const foundBanned = debate_interface_1.BANNED_WORDS.find((word) => content.toLowerCase().includes(word));
    const debate = yield prisma_1.prisma.debate.findUnique({ where: { id: debateId } });
    if (!debate || new Date() > debate.endsAt) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Debate is closed.");
    }
    if (foundBanned) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Inappropriate word detected!`);
    }
    const argument = yield prisma_1.prisma.argument.create({
        data: {
            content,
            side,
            userEmail,
            debateId,
        },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    image: true,
                },
            },
        },
    });
    return argument;
});
const editArgument = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { userEmail, argumentId, content } = payload;
    const argument = yield prisma_1.prisma.argument.findFirst({
        where: {
            id: argumentId,
        },
        include: {
            user: true,
        },
    });
    if (!argument) {
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Argument not found.");
    }
    const createdAtDate = new Date(argument.createdAt);
    const now = new Date();
    const timeDiff = now.getTime() - createdAtDate.getTime();
    if (timeDiff > 5 * 60 * 1000) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Edit argument time has expired (5 minutes).");
    }
    if (userEmail !== argument.userEmail) {
        throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "You are not authorized to edit this argument.");
    }
    const foundBanned = debate_interface_1.BANNED_WORDS.find((word) => content.toLowerCase().includes(word));
    if (foundBanned) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, `Inappropriate word detected!`);
    }
    const updatedArgument = yield prisma_1.prisma.argument.update({
        where: {
            id: argument.id,
        },
        data: {
            content,
        },
    });
    return updatedArgument;
});
const voteArgument = (userEmail, argumentId) => __awaiter(void 0, void 0, void 0, function* () {
    const alreadyVoted = yield prisma_1.prisma.vote.findFirst({
        where: {
            userEmail,
            argumentId,
        },
    });
    const argument = yield prisma_1.prisma.argument.findUnique({
        where: { id: argumentId },
        include: { debate: true },
    });
    if (!argument || new Date() > argument.debate.endsAt) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Debate is closed.");
    }
    if (alreadyVoted) {
        throw new ApiError_1.default(http_status_1.default.BAD_REQUEST, "Already voted.");
    }
    return yield prisma_1.prisma.vote.create({
        data: {
            userEmail,
            argumentId,
        },
    });
});
const getWinnerSide = (debateId) => __awaiter(void 0, void 0, void 0, function* () {
    const votes = yield prisma_1.prisma.argument.findMany({
        where: { debateId },
        include: { votes: true },
    });
    const supportVotes = votes
        .filter((a) => a.side === "Support")
        .reduce((acc, a) => acc + a.votes.length, 0);
    const opposeVotes = votes
        .filter((a) => a.side === "Oppose")
        .reduce((acc, a) => acc + a.votes.length, 0);
    if (supportVotes === opposeVotes) {
        return "Draw";
    }
    return supportVotes > opposeVotes ? "Support" : "Oppose";
});
const getDebateDetails = (debateId, userEmail) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const debate = yield prisma_1.prisma.debate.findUnique({
        where: { id: debateId },
    });
    if (!debate)
        throw new ApiError_1.default(http_status_1.default.NOT_FOUND, "Debate not found");
    const debateArguments = yield prisma_1.prisma.argument.findMany({
        where: { debateId },
        orderBy: { createdAt: "desc" },
        include: {
            user: {
                select: {
                    name: true,
                    email: true,
                    image: true,
                },
            },
            votes: true,
        },
    });
    const isRunning = new Date() < debate.endsAt;
    let iParticipated = false;
    let mySide = null;
    if (userEmail) {
        const myArgument = debateArguments.find((arg) => arg.user.email === userEmail);
        if (myArgument) {
            iParticipated = true;
            mySide = myArgument.side;
        }
    }
    const baseData = {
        debateId: debate.id,
        endsAt: debate.endsAt,
        iParticipated,
        mySide,
    };
    const argumentsWithVotes = debateArguments
        .filter((arg) => arg.content.trim() !== "")
        .map((arg) => ({
        id: arg.id,
        content: arg.content,
        side: arg.side,
        voteCount: arg.votes.length,
        user: arg.user,
        createdAt: arg.createdAt,
    }));
    if (isRunning) {
        return Object.assign(Object.assign({}, baseData), { debateStatus: "running", arguments: argumentsWithVotes });
    }
    // Calculate scoreBoard & winner side if debate is closed
    const winnerSide = yield getWinnerSide(debateId);
    const userMap = new Map();
    for (const arg of debateArguments) {
        if (!arg.content || arg.content.trim() === "")
            continue;
        const voteCount = arg.votes.length;
        const email = arg.user.email;
        if (userMap.has(email)) {
            userMap.get(email).totalVotes += voteCount;
        }
        else {
            userMap.set(email, {
                name: arg.user.name,
                email,
                image: (_a = arg.user.image) !== null && _a !== void 0 ? _a : null,
                totalVotes: voteCount,
                side: arg.side,
            });
        }
    }
    const scoreBoard = Array.from(userMap.values()).sort((a, b) => b.totalVotes - a.totalVotes);
    return Object.assign(Object.assign({}, baseData), { debateStatus: "closed", winnerSide,
        scoreBoard, arguments: argumentsWithVotes });
});
const getScoreboard = (_a) => __awaiter(void 0, [_a], void 0, function* ({ filter, page = 1, limit = 10, }) {
    let dateFilter = {};
    const now = new Date();
    if (filter === "weekly") {
        dateFilter = {
            createdAt: {
                gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
            },
        };
    }
    else if (filter === "monthly") {
        dateFilter = {
            createdAt: {
                gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
            },
        };
    }
    const users = yield prisma_1.prisma.user.findMany({
        include: {
            arguments: {
                where: dateFilter,
                include: {
                    votes: true,
                },
            },
        },
    });
    const scoreboard = users
        .map((user) => {
        const totalVotes = user.arguments.reduce((sum, arg) => sum + arg.votes.length, 0);
        const debates = new Set(user.arguments.map((arg) => arg.debateId));
        return {
            name: user.name,
            email: user.email,
            image: user.image,
            totalVotes,
            debatesParticipated: debates.size,
        };
    })
        .sort((a, b) => b.totalVotes - a.totalVotes)
        .filter((user) => (user === null || user === void 0 ? void 0 : user.debatesParticipated) > 0)
        .map((user, index) => (Object.assign(Object.assign({}, user), { position: index + 1 })));
    const startIndex = (page - 1) * limit;
    const paginated = scoreboard.slice(startIndex, startIndex + limit);
    return {
        meta: {
            total: scoreboard.length,
            page,
            limit,
        },
        data: paginated,
    };
});
exports.DebateService = {
    createDebate,
    joinDebate,
    postArgument,
    voteArgument,
    getWinnerSide,
    getScoreboard,
    getDebateDetails,
    getAllDebates,
    editArgument,
};
