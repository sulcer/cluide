import { startServer } from "./app";

const args = Bun.argv.slice(2);
const flag = (name: string): string | undefined => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1];
};

const port = Number(flag("--port") ?? 8787);
if (!Number.isInteger(port) || port <= 0) {
  console.error(`invalid --port: ${flag("--port")}`);
  process.exit(1);
}

const server = startServer(port);
console.log(`cluide listening on ${server.url}`);

if (args.includes("--open")) {
  Bun.spawn([process.platform === "darwin" ? "open" : "xdg-open", server.url.href]);
}
