import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export interface TempHome {
  home: string;
  claude: string;
  project: string;
  write(rel: string, content: string): string;
  cleanup(): void;
}

// A fresh HOME per test: ~/.claude, ~/.claude.json with one project, ~/repo as that project.
export function tempHome(): TempHome {
  const home = realpathSync(mkdtempSync(join(tmpdir(), "cluide-test-")));
  const claude = join(home, ".claude");
  const project = join(home, "repo");
  mkdirSync(claude, { recursive: true });
  mkdirSync(join(project, ".claude"), { recursive: true });
  writeFileSync(join(home, ".claude.json"), JSON.stringify({ mcpServers: {}, projects: { [project]: {} } }));
  const previous = process.env.HOME;
  process.env.HOME = home;
  return {
    home,
    claude,
    project,
    write(rel, content) {
      const path = join(home, rel);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content);
      return path;
    },
    cleanup() {
      process.env.HOME = previous;
      rmSync(home, { recursive: true, force: true });
    },
  };
}
