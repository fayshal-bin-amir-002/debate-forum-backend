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

  const debate = await prisma.debate.findUnique({ where: { id: debateId } });
  if (!debate || new Date() > debate.endsAt) {
    throw new ApiError(status.BAD_REQUEST, "Debate is closed.");
  }

  if (foundBanned) {
    throw new ApiError(status.BAD_REQUEST, `Inappropriate word detected!`);
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

const editArgument = async (payload: {
  userEmail: string;
  argumentId: string;
  content: string;
}) => {
  const { userEmail, argumentId, content } = payload;
  const argument = await prisma.argument.findFirst({
    where: {
      id: argumentId,
    },
    include: {
      user: true,
    },
  });

  if (!argument) {
    throw new ApiError(status.NOT_FOUND, "Argument not found.");
  }

  const createdAtDate = new Date(argument.createdAt);
  const now = new Date();
  const timeDiff = now.getTime() - createdAtDate.getTime();

  if (timeDiff > 5 * 60 * 1000) {
    throw new ApiError(
      status.BAD_REQUEST,
      "Edit argument time has expired (5 minutes)."
    );
  }

  if (userEmail !== argument.userEmail) {
    throw new ApiError(
      status.FORBIDDEN,
      "You are not authorized to edit this argument."
    );
  }

  const updatedArgument = await prisma.argument.update({
    where: {
      id: argument.id,
    },
    data: {
      content,
    },
  });

  return updatedArgument;
};

const voteArgument = async (userEmail: string, argumentId: string) => {
  const alreadyVoted = await prisma.vote.findFirst({
    where: {
      userEmail,
      argumentId,
    },
  });

  const argument = await prisma.argument.findUnique({
    where: { id: argumentId },
    include: { debate: true },
  });

  if (!argument || new Date() > argument.debate.endsAt) {
    throw new ApiError(status.BAD_REQUEST, "Debate is closed.");
  }

  if (alreadyVoted) {
    throw new ApiError(status.BAD_REQUEST, "Already voted.");
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
    return {
      ...baseData,
      debateStatus: "running",
      arguments: argumentsWithVotes,
    };
  }

  // Calculate scoreBoard & winner side if debate is closed
  const winnerSide = await getWinnerSide(debateId);

  const userMap = new Map<
    string,
    {
      name: string;
      email: string;
      image: string | null;
      totalVotes: number;
      side: "Support" | "Oppose";
    }
  >();

  for (const arg of debateArguments) {
    if (!arg.content || arg.content.trim() === "") continue;
    const voteCount = arg.votes.length;
    const email = arg.user.email;

    if (userMap.has(email)) {
      userMap.get(email)!.totalVotes += voteCount;
    } else {
      userMap.set(email, {
        name: arg.user.name,
        email,
        image: arg.user.image ?? null,
        totalVotes: voteCount,
        side: arg.side,
      });
    }
  }

  const scoreBoard = Array.from(userMap.values()).sort(
    (a, b) => b.totalVotes - a.totalVotes
  );

  return {
    ...baseData,
    debateStatus: "closed",
    winnerSide,
    scoreBoard,
    arguments: argumentsWithVotes, // Optional: keep this if needed even after closing
  };
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
        image: user.image,
        totalVotes,
        debatesParticipated: debates.size,
      };
    })
    .sort((a, b) => b.totalVotes - a.totalVotes)
    .filter((user) => user?.debatesParticipated > 0)
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
  editArgument,
};
