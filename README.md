# cluide

A tiny local web UI to view and edit your Claude Code setup: `~/.claude`, `~/.claude.json`, and
each project's `CLAUDE.md`, `.claude/` and `.mcp.json`. Settings with schema warnings, memory,
rules, agents, skills, commands, hooks, MCP servers with their precedence, and plugins.


## Screens

- **Settings** with the SchemaStore warnings beside the file, for the user, project and local files.
- **Memory, rules, agents, skills and commands** as plain files, with a diff after every save.
- **Hooks** grouped by event, with the scripts they call.
- **MCP servers** merged across every scope, with what shadows what and project approval.
- **Plugins** with their marketplace, version and an enable switch.

Every screen shares one editor: `⌘S` saves, a conflict shows both versions, `⌘K` finds anything.

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
bun run gif          # re-record the tour above; needs ffmpeg and gifski
```

The design lives in [`docs/spec`](docs/spec/README.md); decisions in [`docs/adr`](docs/adr/README.md).

## License

MIT
