/** Envelope returned by every route handler in /api. */
export type ApiSuccess<T> = { success: true; data: T; meta?: PageMeta };
export type ApiFailure = {
  success: false;
  error: { code: ApiErrorCode; message: string; details?: Record<string, string[]> };
};
export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export type PageMeta = { page: number; pageSize: number; total: number; totalPages: number };
export type Paginated<T> = { items: T[]; meta: PageMeta };

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "TOKEN_EXPIRED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "PLAN_LIMIT"
  | "RATE_LIMITED"
  | "PAYMENT_ERROR"
  | "INTERNAL_ERROR"
  | "NETWORK_ERROR";

/** Normalised client-side error thrown by the API service. */
export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public status = 0,
    public details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
