import type { AxiosRequestConfig } from "axios";
import { http, unwrap } from "./client";
import type { ApiEnvelope, Paginated, PageMeta } from "./types";

type Query = Record<string, string | number | boolean | null | undefined | Date>;

/**
 * Base API Service — every feature service extends this so all requests go through
 * one axios instance (interceptors: auth refresh, error normalisation).
 */
export class BaseApiService {
  constructor(protected readonly basePath = "") {}

  protected url(path = "") {
    return `${this.basePath}${path}`;
  }

  protected async get<T>(path = "", params?: Query, config?: AxiosRequestConfig) {
    const res = await http.get<ApiEnvelope<T>>(this.url(path), { ...config, params: clean(params) });
    return unwrap(res.data);
  }

  protected async getPaginated<T>(path = "", params?: Query): Promise<Paginated<T>> {
    const res = await http.get<ApiEnvelope<T[]>>(this.url(path), { params: clean(params) });
    const items = unwrap(res.data);
    const meta = (res.data.success && res.data.meta) as PageMeta;
    return { items, meta };
  }

  protected async post<T, B = unknown>(path = "", body?: B, config?: AxiosRequestConfig) {
    const res = await http.post<ApiEnvelope<T>>(this.url(path), body, config);
    return unwrap(res.data);
  }

  protected async patch<T, B = unknown>(path = "", body?: B) {
    const res = await http.patch<ApiEnvelope<T>>(this.url(path), body);
    return unwrap(res.data);
  }

  protected async put<T, B = unknown>(path = "", body?: B) {
    const res = await http.put<ApiEnvelope<T>>(this.url(path), body);
    return unwrap(res.data);
  }

  protected async delete<T = { id: string }>(path = "") {
    const res = await http.delete<ApiEnvelope<T>>(this.url(path));
    return unwrap(res.data);
  }

  protected async upload<T>(path: string, form: FormData, onProgress?: (pct: number) => void) {
    const res = await http.post<ApiEnvelope<T>>(this.url(path), form, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded / e.total) * 100)),
    });
    return unwrap(res.data);
  }
}

function clean(params?: Query) {
  if (!params) return undefined;
  const out: Record<string, string | number | boolean> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    out[k] = v instanceof Date ? v.toISOString() : v;
  }
  return out;
}
