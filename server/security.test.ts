import { describe, expect, test } from "bun:test";
import { ApiError } from "./errors";
import { assertTrusted } from "./security";

const PORT = 8787;
const request = (method: string, headers: Record<string, string>) =>
  new Request("http://127.0.0.1:8787/api/file", { method, headers });

const forbidden = (req: Request) => {
  try { assertTrusted(req, PORT); } catch (e) {
    expect(e).toBeInstanceOf(ApiError);
    expect((e as ApiError).status).toBe(403);
    return;
  }
  throw new Error("expected 403");
};

describe("assertTrusted", () => {
  test("lets any GET through", () => {
    expect(() => assertTrusted(request("GET", {}), PORT)).not.toThrow();
  });
  test("lets a PUT with the right host and header through", () => {
    expect(() => assertTrusted(request("PUT", { host: "127.0.0.1:8787", "x-cluide": "1" }), PORT)).not.toThrow();
  });
  test("accepts localhost as host and the Vite dev origin", () => {
    expect(() => assertTrusted(request("POST", { host: "localhost:8787", "x-cluide": "1", origin: "http://localhost:5173" }), PORT)).not.toThrow();
  });
  test("rejects a PUT without the X-Cluide header", () => {
    forbidden(request("PUT", { host: "127.0.0.1:8787" }));
  });
  test("rejects a foreign Host", () => {
    forbidden(request("PUT", { host: "evil.example:8787", "x-cluide": "1" }));
  });
  test("rejects a foreign Origin", () => {
    forbidden(request("DELETE", { host: "127.0.0.1:8787", "x-cluide": "1", origin: "http://evil.example" }));
  });
});
