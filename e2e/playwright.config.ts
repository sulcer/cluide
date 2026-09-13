import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  outputDir: "./test-results",
  timeout: 30_000,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:8790",
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
    colorScheme: "dark",
  },
  webServer: {
    command: "bun run build && bun scripts/e2e-server.ts",
    cwd: "..",
    url: "http://127.0.0.1:8790/api/projects",
    reuseExistingServer: false,
    timeout: 90_000,
  },
});
