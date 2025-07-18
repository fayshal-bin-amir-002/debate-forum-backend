import { duration } from "zod/v4/classic/iso.cjs";
import { prisma } from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";
import status from "http-status";

const BANNED_WORDS = ["stupid", "idiot", "dumb"];

const createDebate = async (payload: any) => {
  const userEmail = payload?.userEmail;

  const user = await prisma.user.findUnique({
    where: {
      email: userEmail,
    },
  });

  if (!user) {
    throw new ApiError(status.NOT_FOUND, "User not exists");
  }

  const endsAt = new Date(Date.now() + payload.duration * 60 * 60 * 1000); // duration in hours

  const result = await prisma.debate.create({
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
};

const getAllDebates = async () => {
  const now = new Date();

  const debates = await prisma.debate.findMany({
    select: {
      id: true,
      title: true,
      createdAt: true,
      endsAt: true,
      category: true,
      duration: true,
      author: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return debates.map((debate) => ({
    id: debate.id,
    title: debate.title,
    authorName: debate.author.name,
    authorEmail: debate.author.email,
    authorImage: debate.author.image,
    category: debate.category,
    duration: debate.duration,
    status: now < debate.endsAt ? "Running" : "Ended",
  }));
};

const joinDebate = async (
  userEmail: string,
  debateId: string,
  side: "Support" | "Oppose"
) => {
  const existing = await prisma.argument.findFirst({
    where: {
      userEmail,
      debateId,
    },
  });

  if (existing) {
    throw new ApiError(status.BAD_REQUEST, "You already joined this debate.");
  }

  return await prisma.argument.create({
    data: {
      userEmail,
      debateId,
      side,
      content: "",
    },
  });
};

const postArgument = async (
  userEmail: string,
  debateId: string,
  content: string,
  side: "Support" | "Oppose"
) => {
  const foundBanned = BANNED_WORDS.find((word) =>
    content.toLowerCase().includes(word)
  );

  if (foundBanned) {
    throw new ApiError(
      status.BAD_REQUEST,
      `Inappropriate word detected: "${foundBanned}"`
    );
  }

  const debate = await prisma.debate.findUnique({ where: { id: debateId } });
  if (!debate || new Date() > debate.endsAt) {
    throw new ApiError(status.BAD_REQUEST, "Debate is closed.");
  }

  const argument = await prisma.argument.create({
    data: {
      content,
      side,
      userEmail,
      debateId,
    },
    include: {
      user: true,
    },
  });

  return argument;
};

const voteArgument = async (userEmail: string, argumentId: string) => {
  const alreadyVoted = await prisma.vote.findFirst({
    where: {
      userEmail,
      argumentId,
    },
  });

  if (alreadyVoted) {
    throw new ApiError(status.BAD_REQUEST, "Already voted.");
  }

  const argument = await prisma.argument.findUnique({
    where: { id: argumentId },
    include: { debate: true },
  });

  if (!argument || new Date() > argument.debate.endsAt) {
    throw new ApiError(status.BAD_REQUEST, "Debate is closed.");
  }

  return await prisma.vote.create({
    data: {
      userEmail,
      argumentId,
    },
  });
};

const getWinnerSide = async (debateId: string) => {
  const votes = await prisma.argument.findMany({
    where: { debateId },
    include: { votes: true },
  });

  const supportVotes = votes
    .filter((a) => a.side === "Support")
    .reduce((acc, a) => acc + a.votes.length, 0);
  const opposeVotes = votes
    .filter((a) => a.side === "Oppose")
    .reduce((acc, a) => acc + a.votes.length, 0);

  return supportVotes > opposeVotes ? "Support" : "Oppose";
};

const getScoreboard = async (filter: "weekly" | "monthly" | "all-time") => {
  let dateFilter = {};
  const now = new Date();

  if (filter === "weekly") {
    dateFilter = {
      createdAt: {
        gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
    };
  } else if (filter === "monthly") {
    dateFilter = {
      createdAt: {
        gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      },
    };
  }

  const users = await prisma.user.findMany({
    include: {
      arguments: {
        where: dateFilter,
        include: {
          votes: true,
        },
      },
    },
  });

  return users
    .map((user) => {
      const totalVotes = user.arguments.reduce(
        (sum, arg) => sum + arg.votes.length,
        0
      );
      const debates = new Set(user.arguments.map((arg) => arg.debateId));

      return {
        name: user.name,
        email: user.email,
        totalVotes,
        debatesParticipated: debates.size,
      };
    })
    .sort((a, b) => b.totalVotes - a.totalVotes);
};

const getDebateDetails = async (debateId: string) => {
  const debate = await prisma.debate.findUnique({
    where: { id: debateId },
    include: {
      arguments: {
        include: {
          user: true,
          votes: true,
        },
      },
    },
  });

  if (!debate) throw new ApiError(status.NOT_FOUND, "Debate not found");

  const isRunning = new Date() < debate.endsAt;

  if (isRunning) {
    const argumentsWithVotes = debate.arguments.map((arg) => ({
      id: arg.id,
      content: arg.content,
      side: arg.side,
      voteCount: arg.votes.length,
      user: arg.user,
    }));

    return {
      debateStatus: "running",
      arguments: argumentsWithVotes,
    };
  } else {
    const winnerSide = await getWinnerSide(debateId);
    const leaderboard = await getScoreboard("all-time");

    return {
      debateStatus: "closed",
      winnerSide,
      leaderboard,
    };
  }
};

export const DebateService = {
  createDebate,
  joinDebate,
  postArgument,
  voteArgument,
  getWinnerSide,
  getScoreboard,
  getDebateDetails,
  getAllDebates,
};
