import { mkdirSync, mkdtempSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

const json = (v: unknown) => `${JSON.stringify(v, null, 2)}\n`;

// `dir` is for the gif, whose frames show paths: it seeds a fixed neutral home instead of a
// temporary one. It is wiped first, so every recording starts from the same fixture.
export function seedHome(dir?: string): string {
  const home = dir ?? mkdtempSync(join(tmpdir(), "cluide-e2e-"));
  if (dir) {
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
  }
  const write = (rel: string, content: string) => {
    const path = join(home, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content);
  };
  const acmeApi = join(home, "acme-api");
  const acmeWeb = join(home, "acme-web");
  const cluide = join(home, "cluide");
  const gone = join(home, "old-repo");
  const cache = join(home, ".claude", "plugins", "cache");

  write(
    ".claude.json",
    json({
      mcpServers: {
        asana: { type: "http", url: "https://mcp.asana.com/mcp" },
        "chrome-devtools": { command: "npx", args: ["-y", "chrome-devtools-mcp@latest"] },
        context7: { type: "http", url: "https://mcp.context7.com/mcp" },
        github: { type: "http", url: "https://api.githubcopilot.com/mcp/" },
        playwright: { command: "npx", args: ["@playwright/mcp@latest"] },
        webstorm: { command: "/Applications/WebStorm.app/Contents/MacOS/webstorm", args: ["mcpServer"] },
      },
      projects: {
        [acmeApi]: {
          mcpServers: {
            "chrome-devtools": {
              command: "npx",
              args: ["-y", "chrome-devtools-mcp@latest", "--headless", "--isolated"],
            },
          },
        },
        [acmeWeb]: {},
        [cluide]: {},
        [gone]: {},
      },
    }),
  );

  write(
    ".claude/settings.json",
    json({
      $schema: "https://json.schemastore.org/claude-code-settings.json",
      model: "opus",
      modelSettings: { effort: "high" },
      mcpServers: {},
      permissions: { allow: ["Bash(bun test:*)", "Bash(git status:*)", "Read(~/.claude/**)"], deny: ["Read(./.env)"] },
      hooks: {
        PreToolUse: [
          { matcher: ["Bash"], hooks: [{ type: "command", command: `${home}/.claude/hooks/validate-git-ops.py` }] },
        ],
        UserPromptSubmit: [
          { matcher: "*", hooks: [{ type: "command", command: `${home}/.claude/hooks/find-desktop-screenshot.py` }] },
        ],
        SessionStart: [
          { matcher: "*", hooks: [{ type: "command", command: `${home}/.claude/hooks/herdr-agent-state.sh` }] },
        ],
      },
      managedMcpServers: { "corp-proxy": { type: "http", url: "https://mcp.internal.example.com/proxy" } },
      enabledPlugins: {
        "superpowers@superpowers-marketplace": true,
        "acme-mcp@acme-marketplace": true,
        "pr-review-toolkit@claude-plugins-official": true,
        "vercel-plugin@vercel-vercel-plugin": false,
        "gitkraken-hooks@gitkraken": true,
        "code-review@claude-plugins-official": false,
        "context7@upstash": true,
        "sentry@sentry": true,
        "playwright@microsoft": false,
      },
    }),
  );

  write(
    ".claude/CLAUDE.md",
    [
      "# Global instructions",
      "",
      "- Prefer editing existing files over creating new ones.",
      "- Conventional Commits without scope. `<type>/<slug>` branches.",
      "- Ask before every commit.",
      "- Read `docs/spec/` before touching code.",
      "- Never use exclamation marks in copy.",
      "",
      "## Tooling",
      "",
      "- Use `bun` where a `bun.lock` exists, otherwise `npm`.",
      "- Run the project's own test command before claiming something works.",
      "",
    ].join("\n"),
  );
  write(".claude/rules/git-workflow.md", "# Git workflow\n\nOne logical change per commit.\n");
  write(".claude/rules/testing.md", "# Testing\n\nAssert whole payloads, not single fields.\n");
  write(".claude/rules/security.md", "# Security\n\nNever paste raw logs into chat.\n");
  write(
    ".claude/agents/reviewer.md",
    "---\nname: reviewer\ndescription: Reviews a diff for correctness and style before it is committed\n---\n\nYou review diffs.\n",
  );
  write(
    ".claude/agents/planner.md",
    "---\nname: planner\ndescription: Turns a spec into a task list\n---\n\nYou plan.\n",
  );
  write(
    ".claude/skills/brainstorming/SKILL.md",
    "---\nname: brainstorming\ndescription: Turns an idea into a design through questions\n---\n\n# Brainstorming\n",
  );
  write(
    ".claude/skills/writing-plans/SKILL.md",
    "---\nname: writing-plans\ndescription: Writes an implementation plan from a spec\n---\n\n# Writing plans\n",
  );
  write(
    ".claude/skills/git-workflow/SKILL.md",
    "---\nname: git-workflow\ndescription: Commit and branch conventions\n---\n\n# Git workflow\n",
  );
  write(".claude/commands/commit.md", "Commit the staged changes with a Conventional Commits message.\n");
  write(".claude/commands/review.md", "Review the current branch against main.\n");
  write(".claude/hooks/validate-git-ops.py", "#!/usr/bin/env python3\nimport sys\nsys.exit(0)\n");
  write(".claude/hooks/find-desktop-screenshot.py", "#!/usr/bin/env python3\nprint('')\n");
  write(".claude/hooks/herdr-agent-state.sh", "#!/bin/sh\nexit 0\n");
  write(".claude/keybindings.json", json({ bindings: [{ context: "Chat", bindings: { "ctrl+k": "chat:clear" } }] }));

  const plugins: Array<[string, string, string, string, { mcp?: Record<string, unknown>; hooks?: boolean }]> = [
    ["superpowers", "superpowers-marketplace", "obra/superpowers", "4.0.3", { hooks: true }],
    [
      "acme-mcp",
      "acme-marketplace",
      "acme/claude-plugins",
      "1.2.0",
      {
        mcp: {
          es: { command: "bun", args: ["run", `${cache}/acme-marketplace/acme-mcp/1.2.0/servers/es.ts`] },
          pg: { command: "bun", args: ["run", `${cache}/acme-marketplace/acme-mcp/1.2.0/servers/pg.ts`] },
          sentry: { type: "http", url: "https://mcp.sentry.dev/mcp" },
        },
      },
    ],
    ["pr-review-toolkit", "claude-plugins-official", "anthropics/claude-plugins-official", "0.9.1", {}],
    [
      "vercel-plugin",
      "vercel-vercel-plugin",
      "vercel/vercel-plugin",
      "0.3.0",
      { mcp: { vercel: { type: "http", url: "https://mcp.vercel.com" } } },
    ],
    ["gitkraken-hooks", "gitkraken", "gitkraken/gk-cli-hooks", "2.1.4", { hooks: true }],
    ["code-review", "claude-plugins-official", "anthropics/claude-plugins-official", "0.9.1", {}],
    [
      "context7",
      "upstash",
      "upstash/context7",
      "1.0.14",
      { mcp: { context7: { type: "http", url: "https://mcp.context7.com/mcp" } } },
    ],
    [
      "sentry",
      "sentry",
      "getsentry/sentry-mcp",
      "0.12.0",
      { mcp: { sentry: { type: "http", url: "https://mcp.sentry.dev/mcp" } }, hooks: true },
    ],
    [
      "playwright",
      "microsoft",
      "microsoft/playwright-mcp",
      "0.0.41",
      { mcp: { playwright: { command: "npx", args: ["@playwright/mcp@latest"] } } },
    ],
  ];
  const registry: Record<string, unknown[]> = {};
  const marketplaces: Record<string, unknown> = {};
  for (const [name, marketplace, repo, version, provides] of plugins) {
    const installPath = join(cache, marketplace, name, version);
    mkdirSync(installPath, { recursive: true });
    registry[`${name}@${marketplace}`] = [
      {
        scope: "user",
        installPath,
        version,
        installedAt: "2026-08-01T10:00:00.000Z",
        lastUpdated: "2026-09-01T10:00:00.000Z",
      },
    ];
    marketplaces[marketplace] = { source: { source: "github", repo } };
    if (provides.mcp) writeFileSync(join(installPath, ".mcp.json"), json({ mcpServers: provides.mcp }));
    if (provides.hooks) {
      mkdirSync(join(installPath, "hooks"), { recursive: true });
      writeFileSync(join(installPath, "hooks", "hooks.json"), json({ hooks: {} }));
    }
  }
  write(".claude/plugins/installed_plugins.json", json({ version: 1, plugins: registry }));
  write(".claude/plugins/known_marketplaces.json", json(marketplaces));

  write("acme-api/CLAUDE.md", "# acme-api\n\nThe public API. Bun and Postgres.\n");
  write(
    "acme-api/.claude/settings.json",
    json({
      hooks: {
        PreToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: `${acmeApi}/.claude/hooks/check.sh` }] }],
      },
    }),
  );
  write("acme-api/.claude/settings.local.json", json({ enabledMcpjsonServers: ["acme-postgres-local"] }));
  write(
    "acme-api/.mcp.json",
    json({
      mcpServers: {
        "acme-postgres-local": {
          command: "docker",
          args: ["exec", "-i", "acme-db", "psql", "-U", "acme", "-d", "acme"],
        },
      },
    }),
  );
  write("acme-api/.claude/rules/api.md", "# API rules\n\nEvery endpoint returns the error shape.\n");
  write("acme-api/.claude/hooks/check.sh", "#!/bin/sh\nexit 0\n");
  write("acme-web/CLAUDE.md", "# acme-web\n");
  write("cluide/CLAUDE.md", "# cluide\n");
  write("cluide/.claude/settings.json", json({}));
  write("cluide/.claude/settings.local.json", '{\n  "permissions": {\n    "allow": [\n  }\n}\n');

  // A small fixed schema, so the settings warnings are identical on every machine.
  write(
    ".cluide/schema-cache.json",
    json({
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        $schema: { type: "string" },
        model: { type: "string" },
        permissions: { type: "object" },
        enabledPlugins: { type: "object" },
        managedMcpServers: { type: "object" },
        hooks: {
          type: "object",
          additionalProperties: {
            type: "array",
            items: { type: "object", properties: { matcher: { type: "string" } } },
          },
        },
      },
    }),
  );
  utimesSync(join(home, ".cluide", "schema-cache.json"), new Date(), new Date());
  return home;
}

if (import.meta.main) console.log(seedHome());
