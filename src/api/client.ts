import type { ApiErrorBody, ErrorCode } from "@shared/api";
import { emit } from "@/lib/events";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ErrorCode | "offline",
    message: string,
    public current?: unknown,
  ) {
    super(message);
  }
}

async function request<T>(method: string, url: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: { "X-Cluide": "1", ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    emit("cluide:offline");
    throw new ApiError(0, "offline", "cluide server is not running");
  }
  emit("cluide:online");
  if (res.status === 204) return undefined as T;
  if (res.ok) return (await res.json()) as T;
  let parsed: ApiErrorBody | undefined;
  try {
    parsed = (await res.json()) as ApiErrorBody;
  } catch {
    // a non-JSON error body; the status is still the truth
  }
  throw new ApiError(
    res.status,
    parsed?.error.code ?? "internal",
    parsed?.error.message ?? res.statusText,
    parsed?.error.current,
  );
}

export const api = {
  get: <T>(url: string) => request<T>("GET", url),
  put: <T>(url: string, body: unknown) => request<T>("PUT", url, body),
  post: <T>(url: string, body: unknown) => request<T>("POST", url, body),
  del: (url: string) => request<void>("DELETE", url),
};

export function q(params: Record<string, string | undefined>): string {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined) s.set(k, v);
  return `?${s}`;
}
