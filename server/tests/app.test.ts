import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { join } from "node:path";
import { startServer } from "../app";
import { tempHome, type TempHome } from "./temp-home";

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
    const noDist = startServer(0, join(t.home, "nodist"));
    try {
      const res = await fetch(`http://127.0.0.1:${noDist.port}/`);
      expect({ status: res.status, text: await res.text() }).toEqual({
        status: 503,
        text: "No dist/ yet. Run: bun run build",
      });
    } finally {
      noDist.stop(true);
    }
  });
  test("falls back to index.html for / and any client route", async () => {
    t.write("dist/index.html", "<!doctype html><title>x</title>");
    const withDist = startServer(0, join(t.home, "dist"));
    try {
      const paths = ["/", "/p/%2FUsers%2Fx/settings"];
      for (const path of paths) {
        const res = await fetch(`http://127.0.0.1:${withDist.port}${path}`);
        expect({ status: res.status, text: await res.text() }).toEqual({
          status: 200,
          text: "<!doctype html><title>x</title>",
        });
      }
    } finally {
      withDist.stop(true);
    }
  });
});
