import { prisma } from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";
import status from "http-status";
import {
  BANNED_WORDS,
  DebateQueryParams,
  ScoreboardParams,
} from "./debate.interface";

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

const getAllDebates = async (params: DebateQueryParams = {}) => {
  const { searchTerm, sortBy } = params;
  const now = new Date();

  const baseWhere: any = searchTerm
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

  const debates = await prisma.debate.findMany({
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
    orderBy:
      sortBy === "mostVoted"
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
    const totalVotes = debate.arguments.reduce(
      (sum, arg) => sum + arg._count.votes,
      0
    );

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
};

const joinDebate = async (
  debateId: string,
  side: "Support" | "Oppose",
  userEmail: string
) => {
  const existing = await prisma.argument.findFirst({
    where: {
      userEmail,
      debateId,
    },
  });

  if (existing) {
    throw new ApiError(
      status.BAD_REQUEST,
      `You already joined this debate in ${existing?.side} side.`
    );
  }

  const debate = await prisma.debate.findUnique({
    where: {
      id: debateId,
    },
  });

  if (!debate) {
    throw new ApiError(status.NOT_FOUND, "Debate not found");
  }

  const isClosed = new Date() > debate.endsAt;
  if (isClosed) {
    throw new ApiError(status.BAD_REQUEST, "Cannot join. Debate is closed.");
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
    throw new ApiError(status.BAD_REQUEST, `Inappropriate word detected!`);
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

  if (supportVotes === opposeVotes) {
    return "Draw";
  }

  return supportVotes > opposeVotes ? "Support" : "Oppose";
};

const getDebateDetails = async (debateId: string, userEmail?: string) => {
  const debate = await prisma.debate.findUnique({
    where: { id: debateId },
  });

  if (!debate) throw new ApiError(status.NOT_FOUND, "Debate not found");

  const debateArguments = await prisma.argument.findMany({
    where: {
      debateId,
    },
    orderBy: {
      createdAt: "desc",
    },
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
  let mySide: "Support" | "Oppose" | null = null;

  if (userEmail) {
    const myArgument = debateArguments.find(
      (arg) => arg.user.email === userEmail
    );
    if (myArgument) {
      iParticipated = true;
      mySide = myArgument.side;
    }
  }

  if (isRunning) {
    const argumentsWithVotes = debateArguments
      .filter((arg) => arg.content.trim() !== "")
      .map((arg) => ({
        id: arg.id,
        content: arg.content,
        side: arg.side,
        voteCount: arg.votes.length,
        user: arg.user,
      }));

    return {
      debateStatus: "running",
      iParticipated,
      mySide,
      endsAt: debate.endsAt,
      arguments: argumentsWithVotes,
    };
  } else {
    const winnerSide = await getWinnerSide(debateId);

    const userMap = new Map<
      string,
      {
        name: string;
        email: string;
        image: string | null;
        totalVotes: number;
      }
    >();

    for (const arg of debateArguments) {
      if (!arg.content || arg.content.trim() === "") continue;
      const existing = userMap.get(arg.user.email);
      const voteCount = arg.votes.length;

      if (existing) {
        existing.totalVotes += voteCount;
      } else {
        userMap.set(arg.user.email, {
          name: arg.user.name,
          email: arg.user.email,
          image: arg.user.image ?? null,
          totalVotes: voteCount,
        });
      }
    }

    const scoreBoard = Array.from(userMap.values()).sort(
      (a, b) => b.totalVotes - a.totalVotes
    );

    return {
      debateStatus: "closed",
      iParticipated,
      mySide,
      winnerSide,
      scoreBoard,
    };
  }
};

const getScoreboard = async ({
  filter,
  page = 1,
  limit = 10,
}: ScoreboardParams) => {
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

  const scoreboard = users
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
    .sort((a, b) => b.totalVotes - a.totalVotes)
    .map((user, index) => ({
      ...user,
      position: index + 1,
    }));

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
