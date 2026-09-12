import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { startServer } from "./app";
import { tempHome, type TempHome } from "./testing";

let t: TempHome;
let server: ReturnType<typeof startServer>;
beforeEach(() => { t = tempHome(); server = startServer(0); });
afterEach(() => { server.stop(true); t.cleanup(); });

const url = (path: string) => `http://127.0.0.1:${server.port}${path}`;

describe("app", () => {
  test("answers an unknown api route with the error shape", async () => {
    const res = await fetch(url("/api/nope"));
    expect({ status: res.status, body: await res.json() }).toEqual({
      status: 404,
      body: { error: { code: "not_found", message: "no route /api/nope" } },
    });
  });
  test("rejects a write without the X-Cluide header before touching any resource", async () => {
    const res = await fetch(url("/api/file"), { method: "PUT", body: "{}" });
    expect({ status: res.status, body: await res.json() }).toEqual({
      status: 403,
      body: { error: { code: "forbidden", message: "missing X-Cluide header" } },
    });
  });
  test("explains a missing dist/ instead of serving a blank page", async () => {
    const res = await fetch(url("/"));
    expect({ status: res.status, text: await res.text() }).toEqual({
      status: 503,
      text: "No dist/ yet. Run: bun run build",
    });
  });
});
