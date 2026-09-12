# Dev and build

Status: Stable · Planned · 2026-09-12 · How to run cluide while developing it and how it runs when built.

## At a glance

Two processes in development: Vite serves the page with hot reload on port 5173 and proxies
`/api` to the Bun server on 8787. One process in production: Bun serves the built page from
`dist/` and the API from the same origin. Both are started with one script.

## Scripts

| Script | Runs | Notes |
|---|---|---|
| `bun install` | installs from the lockfile | |
| `bun run dev` | `bun --hot server/index.ts & vite` | Vite on `http://localhost:5173`, proxy `/api` → `127.0.0.1:8787` with `changeOrigin: true` so the `Host` check in [`security.md`](./security.md) passes |
| `bun run build` | `vite build` | outputs `dist/` |
| `bun run start` | `bun server/index.ts --open` | serves `dist/` with SPA fallback plus `/api`; opens the browser |
| `bun test` | server module tests | see [`testing.md`](./testing.md) |

## Server flags

| Flag | Default | Meaning |
|---|---|---|
| `--port <n>` | `8787` | Listen port. The bind address is always `127.0.0.1`. |
| `--open` | off | Open `http://127.0.0.1:<port>` in the default browser after the server starts. |

## Production serving

`server/index.ts` serves files from `dist/` when the directory exists. Any path that is not `/api/*`
and does not match a file falls back to `dist/index.html`, so react-router deep links work. When
`dist/` is missing, `/` answers with a one-line message pointing at `bun run build`, so a missing
build is obvious rather than a blank page.

## Open questions

None.
