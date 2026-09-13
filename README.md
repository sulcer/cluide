# cluide

A tiny local web UI to view and edit your Claude Code setup: `~/.claude`, `~/.claude.json`, and
each project's `CLAUDE.md`, `.claude/` and `.mcp.json`. Settings with schema warnings, memory,
rules, agents, skills, commands, hooks, MCP servers with their precedence, and plugins.

## Run

```
bunx cluide
```

It needs [Bun](https://bun.sh). `bun add -g cluide` installs the `cluide` command. Flags:
`--port <n>` (default 8787), `--open` to open the browser, `--version`.

## What it does to your files

Every save is backed up to `~/.cluide/backups`, written atomically, checked against the version
you loaded (a conflict shows a dialog, never a silent overwrite), and answered with a diff. The
server listens on `127.0.0.1` only and accepts writes only from its own page.

## Development

```
bun install
bun run dev          # Vite on :5173, API on :8787
bun run test         # unit tests against a temporary home
bun run e2e          # Playwright against a seeded temporary home
bun run typecheck
```

The design lives in [`docs/spec`](docs/spec/README.md); decisions in [`docs/adr`](docs/adr/README.md).

## License

MIT
