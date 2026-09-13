import { existsSync } from "node:fs";
import { join, normalize, sep } from "node:path";
import { ApiError } from "./errors";
import { createFile, deleteFile, listFiles, readFile, writeFile } from "./resources/files";
import { deleteMcp, listMcp, putMcp, setMcpApproval } from "./resources/mcp";
import { listPlugins, setPluginEnabled } from "./resources/plugins";
import { listProjects } from "./resources/projects";
import { readSettings, writeSettings } from "./resources/settings";
import { schemaJson } from "./schema";
import { assertTrusted } from "./security";

type Handler = (req: Request) => unknown;
type Handle = (fn: Handler, status?: number) => (req: Request) => Promise<Response>;

const DIST = join(import.meta.dir, "..", "dist");

export function startServer(port: number, dist: string = DIST) {
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
      return serveStatic(dist, pathname);
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
    "/api/projects": { GET: handle(() => listProjects()) },
    "/api/files": { GET: handle((req) => listFiles(query(req, "scope"), query(req, "kind"))) },
    "/api/file": {
      GET: handle((req) => readFile(query(req, "path"))),
      PUT: handle(async (req) => writeFile(await req.json())),
      POST: handle(async (req) => createFile(await req.json()), 201),
      DELETE: handle((req) => {
        deleteFile(query(req, "path"), optional(req, "etag"));
        return noContent();
      }),
    },
    "/api/settings": {
      GET: handle((req) => readSettings(query(req, "scope"), query(req, "file"))),
      PUT: handle(async (req) => writeSettings(await req.json())),
    },
    "/api/settings/schema": {
      GET: handle(() => {
        const json = schemaJson();
        if (json === null) throw new ApiError(404, "not_found", "settings schema unavailable");
        return json;
      }),
    },
    "/api/plugins": {
      GET: handle(() => listPlugins()),
      PUT: handle(async (req) => setPluginEnabled(await req.json())),
    },
    "/api/mcp": {
      GET: handle((req) => listMcp(query(req, "scope"))),
      PUT: handle(async (req) => putMcp(await req.json())),
      DELETE: handle((req) => {
        deleteMcp(query(req, "scope"), query(req, "target"), query(req, "name"), optional(req, "etag"));
        return noContent();
      }),
    },
    "/api/mcp/approval": { POST: handle(async (req) => setMcpApproval(await req.json())) },
  };
}

async function serveStatic(dist: string, pathname: string): Promise<Response> {
  if (!existsSync(dist)) return new Response("No dist/ yet. Run: bun run build", { status: 503 });
  const index = Bun.file(join(dist, "index.html"));
  if (pathname === "/") return new Response(index);
  const target = normalize(join(dist, pathname));
  if (!target.startsWith(`${dist}${sep}`)) return new Response(index);
  const file = Bun.file(target);
  return (await file.exists()) ? new Response(file) : new Response(index);
}
