import { existsSync } from "node:fs";
import { join, normalize, sep } from "node:path";
import { ApiError } from "./errors";
import { assertTrusted } from "./security";

type Handler = (req: Request) => unknown;
type Handle = (fn: Handler, status?: number) => (req: Request) => Promise<Response>;

const DIST = join(import.meta.dir, "..", "dist");

export function startServer(port: number) {
  let actualPort = port;

  // Wraps a resource call: guard, run, JSON, and never a raw exception.
  const handle: Handle = (fn, status = 200) => async (req) => {
    try {
      assertTrusted(req, actualPort);
      const data = await fn(req);
      return data instanceof Response ? data : Response.json(data, { status });
    } catch (e) {
      if (e instanceof ApiError) return e.toResponse();
      console.error(e);
      return new ApiError(500, "internal", (e as Error).message).toResponse();
    }
  };

  const server = Bun.serve({
    hostname: "127.0.0.1",
    port,
    routes: routes(handle),
    fetch: handle(async (req) => {
      const { pathname } = new URL(req.url);
      if (pathname.startsWith("/api/")) throw new ApiError(404, "not_found", `no route ${pathname}`);
      return serveStatic(pathname);
    }),
  });
  actualPort = server.port ?? port;
  return server;
}

export const query = (req: Request, name: string): string => {
  const value = new URL(req.url).searchParams.get(name);
  if (value === null) throw new ApiError(400, "bad_request", `missing query parameter: ${name}`);
  return value;
};

export const optional = (req: Request, name: string): string | undefined =>
  new URL(req.url).searchParams.get(name) ?? undefined;

export const noContent = (): Response => new Response(null, { status: 204 });

// Resource routes are added here task by task.
function routes(handle: Handle) {
  return {
    "/api/health": { GET: handle(() => ({ ok: true })) },
  };
}

async function serveStatic(pathname: string): Promise<Response> {
  if (!existsSync(DIST)) return new Response("No dist/ yet. Run: bun run build", { status: 503 });
  const index = Bun.file(join(DIST, "index.html"));
  if (pathname === "/") return new Response(index);
  const target = normalize(join(DIST, pathname));
  if (!target.startsWith(`${DIST}${sep}`)) return new Response(index);
  const file = Bun.file(target);
  return (await file.exists()) ? new Response(file) : new Response(index);
}
