import { describe, expect, test } from "bun:test";
import { version } from "../../package.json";

describe("index", () => {
  test("--version prints the package version and exits 0", () => {
    const run = Bun.spawnSync(["bun", "server/index.ts", "--version"], { cwd: `${import.meta.dir}/../..` });
    expect({ code: run.exitCode, out: run.stdout.toString().trim() }).toEqual({ code: 0, out: version });
  });
});
