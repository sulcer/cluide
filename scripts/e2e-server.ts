import { mkdirSync, writeFileSync } from "node:fs";
import { seedHome } from "./seed-home";

// A path with no user in it: the gif shows it in every breadcrumb, hook command and file header.
const DEMO_HOME = "/Users/Shared/cluide-demo";

const home = seedHome(process.env.GIF ? DEMO_HOME : undefined);
mkdirSync("e2e", { recursive: true });
writeFileSync("e2e/.home", home);
const proc = Bun.spawn(["bun", "server/index.ts", "--port", "8790"], {
  env: { ...process.env, HOME: home },
  stdio: ["inherit", "inherit", "inherit"],
});
const stop = () => {
  proc.kill();
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
await proc.exited;
