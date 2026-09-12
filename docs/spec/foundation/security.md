# Security

Status: Draft · Planned · 2026-09-12 · What cluide defends against, how, and what it deliberately does not.

## At a glance

cluide runs with your user's permissions and edits files that decide what Claude Code executes.
Hooks are shell commands. MCP servers are processes started with the command you configure.
Anyone who can make the cluide server write one of those files can run code as you. The server
has no login, so the whole defence is making sure that only the cluide page in your own browser can
talk to it, and that it can only reach the files it is meant to.

## Threat model

| Threat | How it would happen | Defence |
|---|---|---|
| Cross-site request | A web page you visit posts a form to `http://127.0.0.1:8787/api/file`. A form POST skips the CORS preflight, so the browser sends it. | Mutating requests must carry `X-Cluide: 1`. A custom header forces a preflight, the server never answers preflights, so the browser refuses to send. `Origin`, when present, must match. |
| DNS rebinding | An attacker's domain first resolves to their server, then to `127.0.0.1`, so their page is "same origin" with cluide. | `Host` must be `127.0.0.1:<port>` or `localhost:<port>`. |
| Other machines | The server listens on all interfaces and a laptop on the same network finds it. | Bind `127.0.0.1` only. Never `0.0.0.0`, no flag to change it. |
| Path traversal | A request names `../../.ssh/authorized_keys` or a symlink under `~/.claude` that points outside it. | `realpath`, then the allowlist in [`write-safety.md`](./write-safety.md). Symlinks are resolved before the check. |
| Half-written config | Claude Code reads `settings.json` while cluide is in the middle of writing it. | Write to a temp file in the same directory, then `rename`. |
| Lost or wrong edit | A save overwrites a change made by hand or by Claude Code, or the user regrets an edit. | Content etag → `409` on conflict. Backup before every write. Diff returned and shown. |

## Guards on every mutating request

Applied in `server/security.ts` to every request that is not `GET`, before any resource runs:

1. `Host` header equals `127.0.0.1:<port>` or `localhost:<port>`.
2. `X-Cluide: 1` header is present.
3. `Origin` header, if present, equals the server's own origin or the Vite dev origin.

Any failure is `403 forbidden` with nothing written. No CORS headers are ever emitted. In
development, Vite proxies `/api` with `changeOrigin`, so the browser only ever talks same-origin
and the `Host` the server sees is its own.

## Not defended, on purpose

| Not defended | Why |
|---|---|
| Another OS user on the same machine | They can reach `127.0.0.1:8787` too. cluide assumes a single-user dev machine, like Claude Code itself. |
| A malicious browser extension | It is same-origin with the page and can set any header. Out of any web app's reach. |
| Secrets in the files | `settings.json` `env` and MCP server `env` or `headers` may hold tokens. cluide shows file contents as they are and does not mask them. Do not screen-share the MCP screen. |
| Claude Code itself | cluide does not sandbox what a hook or MCP server does. It edits the config; Claude Code runs it. |

## Dependencies

Few, pinned to exact versions, installed from the lockfile. The runtime set is React, react-router,
the shadcn primitives, ajv and lucide. Anything new must earn its place against "a few lines of
code do it". `bun install` runs with the lockfile committed; a diff in the lockfile is reviewed
like code.

## Open questions

None.
