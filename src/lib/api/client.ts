import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { ApiError, type ApiEnvelope, type ApiFailure } from "./types";

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean; _skipAuthRefresh?: boolean };

const AUTH_EXEMPT = ["/auth/login", "/auth/register", "/auth/refresh", "/auth/logout"];

/** Listeners notified when the session can no longer be refreshed (e.g. to clear stores + redirect). */
const sessionExpiredListeners = new Set<() => void>();
export const onSessionExpired = (fn: () => void) => {
  sessionExpiredListeners.add(fn);
  return () => {
    sessionExpiredListeners.delete(fn);
  };
};

/** Single-flight refresh: concurrent 401s wait for the same refresh promise. */
let refreshPromise: Promise<void> | null = null;

function createClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: "/api",
    withCredentials: true,
    timeout: 30_000,
    headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
  });

  // ── Request: tag requests (auth cookies are httpOnly, sent automatically) ──
  instance.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
      config.headers.set("X-Client-TZ", Intl.DateTimeFormat().resolvedOptions().timeZone);
    }
    return config;
  });

  // ── Response: refresh expired access token once, then normalise errors ──
  instance.interceptors.response.use(
    (res) => res,
    async (error: AxiosError<ApiFailure>) => {
      const config = error.config as RetriableConfig | undefined;
      const status = error.response?.status ?? 0;
      const code = error.response?.data?.error?.code;
      const isExempt = AUTH_EXEMPT.some((p) => config?.url?.includes(p));

      if (config && status === 401 && code === "TOKEN_EXPIRED" && !config._retry && !isExempt) {
        config._retry = true;
        try {
          refreshPromise ??= instance
            .post("/auth/refresh", undefined, { _skipAuthRefresh: true } as RetriableConfig)
            .then(() => undefined)
            .finally(() => {
              refreshPromise = null;
            });
          await refreshPromise;
          return instance(config);
        } catch {
          sessionExpiredListeners.forEach((fn) => fn());
          return Promise.reject(new ApiError("UNAUTHORIZED", "Session expired. Please log in again.", 401));
        }
      }

      if (status === 401 && !isExempt && code !== "TOKEN_EXPIRED") {
        sessionExpiredListeners.forEach((fn) => fn());
      }

      return Promise.reject(toApiError(error));
    },
  );

  return instance;
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError<ApiFailure>(error)) {
    const body = error.response?.data;
    if (body && body.success === false && body.error) {
      return new ApiError(body.error.code, body.error.message, error.response?.status ?? 0, body.error.details);
    }
    if (!error.response) return new ApiError("NETWORK_ERROR", "Network error. Check your connection.");
    return new ApiError("INTERNAL_ERROR", error.message, error.response.status);
  }
  return new ApiError("INTERNAL_ERROR", error instanceof Error ? error.message : "Something went wrong");
}

export const http = createClient();

/** Unwraps the `{ success, data }` envelope. */
export function unwrap<T>(body: ApiEnvelope<T>): T {
  if (!body.success) throw new ApiError(body.error.code, body.error.message, 0, body.error.details);
  return body.data;
}
