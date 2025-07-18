import { z } from "zod";
import { UserRole } from "@prisma/client";

export const registerUserZodSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .trim()
      .regex(/^\d{11}$/, {
        message: "Phone number must be exactly 11 digits.",
      }),
    password: z
      .string()
      .trim()
      .min(6, { message: "Password must be minimum 6 characters long." }),
  }),
});

export const bloodGroupEnum = z.enum([
  "A_POS",
  "A_NEG",
  "B_POS",
  "B_NEG",
  "AB_POS",
  "AB_NEG",
  "O_POS",
  "O_NEG",
]);

export const roleZodSchema = z.object({
  body: z.object({
    role: z.nativeEnum(UserRole, {
      errorMap: () => ({
        message: "Role must be either 'USER' or 'ADMIN'",
      }),
    }),
  }),
});

export const statusZodSchema = z.object({
  body: z.object({
    status: z.union([z.literal("true"), z.literal("false")]),
  }),
});
