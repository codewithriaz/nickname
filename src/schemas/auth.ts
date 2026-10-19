import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(128)
  .regex(/[A-Za-z]/, "Must contain a letter")
  .regex(/\d/, "Must contain a number");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.email().trim().toLowerCase(),
  password: passwordSchema,
  referralCode: z.string().trim().max(32).optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1, "Enter your password").max(128),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({ email: z.email().trim().toLowerCase() });
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({ token: z.string().min(20), password: passwordSchema });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const updateAccountSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  avatarUrl: z.string().max(2048).nullable().optional(),
});
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
