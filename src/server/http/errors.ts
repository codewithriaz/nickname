import type { ApiErrorCode } from "@/lib/api/types";

export class AppError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public status: number,
    public details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const badRequest = (msg = "Bad request", details?: Record<string, string[]>) =>
  new AppError("BAD_REQUEST", msg, 400, details);
export const unauthorized = (msg = "Please log in") => new AppError("UNAUTHORIZED", msg, 401);
export const tokenExpired = () => new AppError("TOKEN_EXPIRED", "Access token expired", 401);
export const forbidden = (msg = "You don't have access to this resource") => new AppError("FORBIDDEN", msg, 403);
export const notFound = (what = "Resource") => new AppError("NOT_FOUND", `${what} not found`, 404);
export const conflict = (msg: string) => new AppError("CONFLICT", msg, 409);
export const planLimit = (msg: string) => new AppError("PLAN_LIMIT", msg, 402);
export const rateLimited = (msg = "Too many requests, slow down") => new AppError("RATE_LIMITED", msg, 429);
export const paymentError = (msg: string) => new AppError("PAYMENT_ERROR", msg, 502);
