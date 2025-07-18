import { prisma } from "../../../shared/prisma";
import ApiError from "../../errors/ApiError";
import { RegisterUserPayload } from "./user.interface";
import status from "http-status";
import bcrypt from "bcrypt";
import config from "../../../config";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import { IPaginationOptions } from "../../interfaces/pagination";
import { calculatePagination } from "../../../helpers/paginationHelper";
import { Prisma, UserRole } from "@prisma/client";
import { userSearchAbleFields } from "./user.constant";

const registerUser = async (payload: RegisterUserPayload) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      phone: payload.phone,
    },
  });

  if (isUserExists) {
    throw new ApiError(
      status.BAD_REQUEST,
      "User already registered. Please login."
    );
  }

  const hashedPassword: string = await bcrypt.hash(payload?.password, 12);

  payload["password"] = hashedPassword;

  const userData = {
    ...payload,
    role: UserRole.USER,
  };

  const result = await prisma.user.create({
    data: userData,
  });

  const accessToken = jwtHelpers.generateToken(
    {
      phone: result.phone,
      id: result.id,
      role: result.role,
      isDonor: result.isDonor,
    },
    config.jwt.jwt_access_token_secret as string,
    config.jwt.jwt_access_token_expires_in as string
  );

  const refreshToken = jwtHelpers.generateToken(
    {
      phone: result.phone,
      id: result.id,
      role: result.role,
      isDonor: result.isDonor,
    },
    config.jwt.jwt_refresh_token_secret as string,
    config.jwt.jwt_refresh_token_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
  };
};

const loginUser = async (payload: RegisterUserPayload) => {
  const user = await prisma.user.findUnique({
    where: {
      phone: payload.phone,
    },
  });

  if (!user) {
    throw new ApiError(status.BAD_REQUEST, "Please register first!");
  }

  if (user.isBlocked) {
    throw new ApiError(status.BAD_REQUEST, "User is blocked!");
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.password,
    user?.password
  );

  if (!isPasswordMatched) {
    throw new ApiError(status.BAD_REQUEST, "Wrong password!");
  }

  const accessToken = jwtHelpers.generateToken(
    {
      phone: user.phone,
      id: user.id,
      role: user.role,
      isDonor: user.isDonor,
    },
    config.jwt.jwt_access_token_secret as string,
    config.jwt.jwt_access_token_expires_in as string
  );

  const refreshToken = jwtHelpers.generateToken(
    {
      phone: user.phone,
      id: user.id,
      role: user.role,
      isDonor: user.isDonor,
    },
    config.jwt.jwt_refresh_token_secret as string,
    config.jwt.jwt_refresh_token_expires_in as string
  );

  return {
    accessToken,
    refreshToken,
  };
};

const refreshToken = async (token: string) => {
  let decodedData;
  try {
    decodedData = jwtHelpers.verifyToken(
      token,
      config.jwt.jwt_refresh_token_secret as string
    );
  } catch (err) {
    throw new ApiError(status.UNAUTHORIZED, "You are not authorized");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: decodedData?.id,
    },
  });

  if (!user) {
    throw new ApiError(status.FORBIDDEN, "User not exists!");
  }

  if (user.isBlocked) {
    throw new ApiError(status.FORBIDDEN, "User is blocked!");
  }

  const accessToken = jwtHelpers.generateToken(
    {
      phone: user.phone,
      id: user.id,
      role: user.role,
      isDonor: user.isDonor,
    },
    config.jwt.jwt_access_token_secret as string,
    config.jwt.jwt_access_token_expires_in as string
  );

  return accessToken;
};

const getAllUser = async (params: any, options: IPaginationOptions) => {
  const { searchTerm, ...rawFilterData } = params;
  const { limit, page, skip } = calculatePagination(options);

  const andConditions: Prisma.UserWhereInput[] = [];

  const filterData: Record<string, string | boolean> = {};
  for (const [key, value] of Object.entries(rawFilterData)) {
    if (value === "true") {
      filterData[key] = true;
    } else if (value === "false") {
      filterData[key] = false;
    } else {
      filterData[key] = value as string;
    }
  }

  if (params?.searchTerm) {
    andConditions.push({
      OR: userSearchAbleFields.map((field) => ({
        [field]: {
          contains: params?.searchTerm,
          mode: "insensitive",
        },
      })),
    });
  }

  if (Object.keys(filterData).length > 0) {
    andConditions.push({
      AND: Object.keys(filterData).map((key) => ({
        [key]: {
          equals: (filterData as any)[key],
        },
      })),
    });
  }

  const whereConditions: Prisma.UserWhereInput =
    andConditions?.length > 0 ? { AND: andConditions } : {};

  const result = await prisma.user.findMany({
    where: whereConditions,
    skip: skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      phone: true,
      role: true,
      isDonor: true,
      isBlocked: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  const total = await prisma.user.count({
    where: whereConditions,
  });

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const roleUpdate = async (id: string, payload: { role: UserRole }) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) {
    throw new ApiError(status.BAD_REQUEST, "User not exists!");
  }

  if (user.isBlocked) {
    throw new ApiError(status.BAD_REQUEST, "User is blocked!");
  }

  const result = await prisma.user.update({
    where: {
      id,
    },
    data: {
      role: payload.role,
    },
    select: {
      id: true,
      phone: true,
      role: true,
      isBlocked: true,
    },
  });

  return result;
};

const statusUpdate = async (
  id: string,
  payload: { status: "true" | "false" }
) => {
  const isUserExists = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!isUserExists) {
    throw new ApiError(status.FORBIDDEN, "User not exists!");
  }

  const isBlocked = payload.status === "true";

  const result = await prisma.$transaction(async (transactionClient: any) => {
    const result = await prisma.user.update({
      where: {
        id,
      },
      data: {
        isBlocked: isBlocked,
      },
      select: {
        id: true,
        phone: true,
        isBlocked: true,
      },
    });

    if (isUserExists.isDonor) {
      const donor = await prisma.donor.findUnique({
        where: {
          user_id: isUserExists.id,
        },
      });

      if (donor?.disabledBy === null && !isBlocked) {
        await transactionClient.donor.update({
          where: {
            user_id: isUserExists.id,
          },
          data: {
            isActive: !isBlocked,
          },
        });
      }
      if (isBlocked) {
        await transactionClient.donor.update({
          where: {
            user_id: isUserExists.id,
          },
          data: {
            isActive: !isBlocked,
          },
        });
      }
    }

    return result;
  });

  return result;
};

export const UserService = {
  registerUser,
  loginUser,
  refreshToken,
  getAllUser,
  roleUpdate,
  statusUpdate,
};
