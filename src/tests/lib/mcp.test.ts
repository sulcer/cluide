import { describe, expect, test } from "bun:test";
import { buildConfig, commandText, readOnly, transportOf } from "@/lib/mcp";

describe("mcp", () => {
  test("transport, command text and read-only", () => {
    expect(transportOf({ command: "npx", args: ["-y", "x"] })).toBe("stdio");
    expect(transportOf({ type: "sse", url: "https://a" })).toBe("sse");
    expect(commandText({ command: "npx", args: ["-y", "x"] })).toBe("npx -y x");
    expect(commandText({ type: "http", url: "https://a/mcp" })).toBe("https://a/mcp");
    const entry = (scope: "user" | "plugin" | "managed") => ({
      name: "x",
      scope,
      file: "/f",
      config: { command: "npx" },
      effective: true,
      shadowedBy: null,
      enabled: null,
      etag: null,
    });
    expect(readOnly(entry("plugin"))).toBe(true);
    expect(readOnly(entry("managed"))).toBe(true);
    expect(readOnly(entry("user"))).toBe(false);
  });

  test("builds a stdio config without empty args", () => {
    expect(buildConfig({ transport: "stdio", command: " npx ", args: "", url: "", headers: "" })).toEqual({
      command: "npx",
    });
    expect(buildConfig({ transport: "stdio", command: "npx", args: "-y\n\nx\n", url: "", headers: "" })).toEqual({
      command: "npx",
      args: ["-y", "x"],
    });
  });

  test("builds an http config with parsed headers", () => {
    expect(
      buildConfig({
        transport: "http",
        command: "",
        args: "",
        url: "https://a ",
        headers: "Authorization: Bearer t\nbad\n",
      }),
    ).toEqual({
      type: "http",
      url: "https://a",
      headers: { Authorization: "Bearer t", bad: "" },
    });
    expect(buildConfig({ transport: "sse", command: "", args: "", url: "https://b", headers: "" })).toEqual({
      type: "sse",
      url: "https://b",
    });
  });
});
