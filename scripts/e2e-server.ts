import { mkdirSync, writeFileSync } from "node:fs";
import { seedHome } from "./seed-home";

const home = seedHome();
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
