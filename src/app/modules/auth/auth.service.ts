import { prisma } from "../../../shared/prisma";
import bcrypt from "bcrypt";
import ApiError from "../../errors/ApiError";
import status from "http-status";

const loginUser = async (payload: any) => {
  const user = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });

  if (!user) {
    if (payload?.provider !== "google") {
      const hashedPassword: string = await bcrypt.hash(payload?.password, 12);
      payload["password"] = hashedPassword;
    } else {
      const data = {
        email: payload?.email,
        name: payload?.name,
        image: payload?.image,
      };
      payload = {
        ...data,
      };
    }

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

  if (user?.password) {
    const isPasswordMatched = await bcrypt.compare(
      payload?.password,
      user?.password
    );

    if (!isPasswordMatched) {
      throw new ApiError(status.BAD_REQUEST, "Wrong password!");
    }
  }

  return {
    email: user?.email,
    name: user?.name,
    image: user?.image,
  };
};

export const AuthService = {
  loginUser,
};
