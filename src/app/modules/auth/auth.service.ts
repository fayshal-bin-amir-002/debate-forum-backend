import { prisma } from "../../../shared/prisma";
import bcrypt from "bcrypt";
import ApiError from "../../errors/ApiError";
import status from "http-status";

const registerUser = async (payload: any) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload?.email,
    },
    select: {
      email: true,
      name: true,
      image: true,
    },
  });

  if (payload?.provider === "google") {
    const data = {
      email: payload?.email,
      name: payload?.name,
      image: payload?.image,
    };
    if (!user) {
      const result = await prisma.user.create({
        data: data,
        select: {
          email: true,
          name: true,
          image: true,
        },
      });
      return result;
    }
    return user;
  } else {
    if (user) {
      throw new ApiError(
        status.BAD_REQUEST,
        "Already registered. Please login/continue with google."
      );
    }
    const hashedPassword: string = await bcrypt.hash(payload?.password, 12);
    payload["password"] = hashedPassword;
    const result = await prisma.user.create({
      data: payload,
      select: {
        email: true,
        name: true,
        image: true,
      },
    });
    return result;
  }
};

const loginUser = async (payload: any) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user) {
    throw new ApiError(status.BAD_REQUEST, "Please register first!");
  }

  const isPasswordMatched = await bcrypt.compare(
    payload.password,
    user?.password as string
  );

  if (!isPasswordMatched) {
    throw new ApiError(status.BAD_REQUEST, "Wrong password!");
  }

  return {
    email: user?.email,
    name: user?.name,
    image: user?.image,
  };
};

export const AuthService = {
  registerUser,
  loginUser,
};
