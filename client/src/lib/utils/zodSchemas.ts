import * as z from "zod";

const emailSchema = z.email({ error: "Invalid email address" });

const userNameSchema = z
  .string()
  .min(4, "Username must be at least 4 characters")
  .max(32, "Username must be at most 32 characters");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must be at most 128 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const loginFormSchema = {
  email: emailSchema,
  password: passwordSchema,
};

export const signupFormSchema = {
  email: emailSchema,
  password: passwordSchema,
  username: userNameSchema,
};
