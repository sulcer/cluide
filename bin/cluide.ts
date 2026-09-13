#!/usr/bin/env bun
// The npm entry point. Bun serves the page and the API; nothing here runs under node.
if (typeof Bun === "undefined") {
  console.error("cluide runs on Bun: https://bun.sh\nTry: bunx cluide");
  process.exit(1);
}
await import("../server/index.ts");
