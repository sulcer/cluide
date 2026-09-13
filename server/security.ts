import { ApiError } from "./errors";

const DEV_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"];

// Every non-GET request must come from the cluide page itself. See docs/spec/foundation/security.md.
export function assertTrusted(req: Request, port: number): void {
  if (req.method === "GET" || req.method === "HEAD") return;
  const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
  const host = req.headers.get("host");
  if (host === null || !hosts.includes(host)) {
    throw new ApiError(403, "forbidden", "unexpected Host header");
  }
  if (req.headers.get("x-cluide") !== "1") {
    throw new ApiError(403, "forbidden", "missing X-Cluide header");
  }
  const origin = req.headers.get("origin");
  const origins = [...hosts.map((h) => `http://${h}`), ...DEV_ORIGINS];
  if (origin !== null && !origins.includes(origin)) {
    throw new ApiError(403, "forbidden", "unexpected Origin header");
  }
}
