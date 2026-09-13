# Foundation

Status: Stable · Built · 2026-09-12 · The stack, repository shape and safety rules every part of cluide builds on.

## At a glance

cluide is a small web page served by a local process. The page runs in your browser. The process
runs on your machine as you, and reads and writes the real files Claude Code uses: everything under
`~/.claude`, the state file `~/.claude.json`, and each project's `CLAUDE.md`, `.claude/` and
`.mcp.json`. There is no database and no login. Every write goes through one function that backs
the file up, writes atomically, detects conflicts and returns a diff. The server only accepts
writes from the cluide page itself, because those files control what Claude Code executes.

## Diagram

![System overview](./overview.svg)

The browser talks JSON to the Bun server on `127.0.0.1:8787`. The server exposes one resource per
kind of thing (projects, files, settings, MCP servers, plugins). Every resource reads files fresh on
each request and writes through the single write primitive. Claude Code reads and writes the same
files on its own schedule, which is why conflict detection exists.

## Principles

- **The files are the source of truth.** No cache, no database. Every screen reads from disk on
  load and writes back to the same file Claude Code reads.
- **Every write is safe.** Backup, atomic rename, conflict detection, diff. One code path, no
  exceptions. See [`write-safety.md`](./write-safety.md).
- **Scope is first-class.** Everything that exists at both user and project level takes a `scope`
  from day one. See [`file-map.md`](./file-map.md).
- **Typed only where merging is needed.** Text files get one generic resource. Settings, MCP and
  plugins get typed resources because their view spans several files. See [`api`](../api/README.md).
- **Localhost is not a trust boundary.** Writes are guarded against cross-site requests even though
  there is no auth. See [`security.md`](./security.md).

## Stack

| Layer | Choice | Why |
|---|---|---|
| API server | Bun, `Bun.serve`, TypeScript | The standard library covers files, JSON, routing and spawning `git`. No Express. |
| Frontend build | Vite | The shadcn CLI detects it, Tailwind is one plugin, every example on the internet matches. Bun's own HTML imports would also work; Vite is the mainstream path. |
| UI | React 19, Tailwind v4, shadcn/ui, lucide icons | shadcn requires React. Tailwind v4 is what current shadcn targets. |
| Routing | react-router | Per-screen URLs that carry the scope, deep links, back and forward. |
| Validation | ajv | `settings.json` has a published JSON schema on SchemaStore (142 properties). |
| Diff | `git diff --no-index` via `Bun.spawn` | Always present on a dev box; no diff library. |
| Tests | `bun test` for server modules and pure frontend helpers | Playwright covers the rest of the frontend: a smoke test plus a render spec for visual review. |
| Formatter and linter | Biome | One dependency and one config for formatting, import order and lint across TypeScript, JSX, JSON and CSS; ESLint plus Prettier would be six. Changes: [`2026-09-13-adopt-biome-for-formatting-and-linting.md`](../../adr/2026-09-13-adopt-biome-for-formatting-and-linting.md) |

Vite over Bun's own bundler is decided in [`2026-09-12-vite-builds-the-page.md`](../../adr/2026-09-12-vite-builds-the-page.md).

Not used, on purpose: Next, TanStack Query, a form library, a state library, a database. Each is
added when a concrete need appears, not before.

## Repository layout

```
cluide/
  package.json            # single package; scripts: dev, build, start, test, typecheck, e2e, render
  vite.config.ts          # @tailwindcss/vite; proxy /api -> 127.0.0.1:8787 with changeOrigin
  index.html              # Vite's entry point; loads src/main.tsx
  tsconfig.json           # server, shared, scripts, e2e; paths: @/* -> src/*, @shared/* -> shared/*
  components.json         # shadcn
  biome.json              # formatter, linter and import order; bun run lint, bun run format
  CLAUDE.md, .claude/rules/
  docs/                   # adr/, spec/, plans/, nice-to-have.md
  scripts/
    dev.ts                # spawns the api server and vite, kills both on exit
    seed-home.ts          # a temp home mirroring the design's sample data, for tests and e2e
    e2e-server.ts         # seeds a home and runs the server on 8790
  e2e/
    playwright.config.ts, helpers.ts
    render.spec.ts        # one screenshot per spec state, written to e2e/renders/
    smoke.spec.ts         # load, edit global memory, save, see the diff
  shared/
    api.ts                # request/response types; mirrors docs/spec/api, the spec wins on conflict
  server/
    index.ts              # CLI entry: --port, --open, starts the app
    app.ts                # Bun.serve, route table, handler wrapper, static dist/
    errors.ts             # ApiError and the error response shape, body validation helpers
    security.ts           # host + origin + header guard for mutating requests
    paths.ts              # roots, scope -> file paths, allowlist check
    fs.ts                 # readText, writeText, JSON helpers (backup, atomic, etag, diff)
    schema.ts             # settings schema fetch, disk cache, ajv validate
    resources/
      projects.ts, files.ts, settings.ts, mcp.ts, plugins.ts
    tests/                # bun test, mirroring server/; temp-home.ts is the temp HOME helper
  src/
    tsconfig.json         # the app's own tsconfig: DOM + JSX types, paths relative to src/
    vite-env.d.ts         # Vite's ambient client types
    main.tsx, router.tsx, globals.css
    api/                  # client.ts
    hooks/                # every React hook: useResource, useDraft (the save-state machine),
                           # useRoute, useShortcuts, useWindowEvent, useToast, useTheme
    lib/                  # pure: routes, diff, frontmatter, hooks, mcp. Browser helpers: icons,
                           # keys, json, events, storage, theme, toast, recent.
    components/           # Button, Input, Badge, Kbd, IconButton, Skeleton, Centered, Toaster
    components/ui/        # shadcn (generated)
    shell/                # Shell, Sidebar, ScopeSwitcher, Header, OfflineBanner, CommandMenu
    editor/                # SaveBar, Editor, DiffSheet, ConflictDialog, DeleteDialog — shared by
                           # every editing screen
    screens/               # Screen (picks a screen from the route) plus one file per screen
    tests/                 # bun test, mirroring src/: tests/lib/*.test.ts
```

Rules for growth: one file per screen under `screens/`, sharing `editor/` for editing and `shell/`
for layout; one module per resource under `server/resources/`; both sides import types only from
`shared/api.ts`. Tests live in `<package>/tests/`, mirroring the package; React hooks live in
`src/hooks/`.

## Topic files

| File | What it covers |
|---|---|
| [`file-map.md`](./file-map.md) | Every path cluide reads or writes, per scope, and the ones it never touches. |
| [`write-safety.md`](./write-safety.md) | The single write primitive: allowlist, etag, backup, atomic rename, diff. With the save-flow SVG. |
| [`security.md`](./security.md) | Threat model, the guards on every mutating request, and what is deliberately not defended. |
| [`dev-and-build.md`](./dev-and-build.md) | Scripts, ports, the Vite proxy, production serving. |
| [`testing.md`](./testing.md) | What `bun test` covers and how tests stay off the real `~/.claude`. |

## Open questions

None.
