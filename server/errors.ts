import type { ErrorCode } from "@shared/api";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly current?: unknown,
  ) {
    super(message);
  }

  toResponse(): Response {
    const error: Record<string, unknown> = { code: this.code, message: this.message };
    if (this.current !== undefined) error.current = this.current;
    return Response.json({ error }, { status: this.status });
  }
}

export function requireString(body: unknown, key: string, allowEmpty = false): string {
  const value = (body as Record<string, unknown> | null)?.[key];
  if (typeof value !== "string" || (!allowEmpty && value.length === 0)) {
    throw new ApiError(400, "bad_request", `${key} must be a ${allowEmpty ? "" : "non-empty "}string`);
  }
  return value;
}

export function requireBoolean(body: unknown, key: string): boolean {
  const value = (body as Record<string, unknown> | null)?.[key];
  if (typeof value !== "boolean") {
    throw new ApiError(400, "bad_request", `${key} must be a boolean`);
  }
  return value;
}
