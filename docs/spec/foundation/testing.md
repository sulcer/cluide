# Testing

Status: Stable · Planned · 2026-09-12 · What is tested, how tests stay off the real configuration, and what is deliberately untested in v1.

## At a glance

The server modules are where mistakes cost something: a bad allowlist writes outside `~/.claude`,
a bad merge shows the wrong MCP server, a bad toggle rewrites `settings.json`. Those are unit
tested with `bun test` against a temporary home directory, so no test ever touches the real
`~/.claude`. The frontend gets one browser smoke test once the UI settles, and no unit tests in v1.

## Server tests

Every test creates a temp directory, points `HOME` at it, and seeds the files it needs. Assertions
compare whole payloads, not single fields.

| Module | Must prove |
|---|---|
| `fs.ts` | Allowlist rejects `..` traversal and a symlink that escapes a root. Atomic write leaves no `.cluide-tmp` behind. Etag mismatch returns `409` and writes nothing. A backup exists after a write, and the 51st backup evicts the oldest. The returned diff matches the change. A backup failure aborts the write. |
| `security.ts` | Missing `X-Cluide`, wrong `Host`, foreign `Origin` each give `403` on `PUT` and pass on `GET`. |
| `resources/mcp.ts` | The merge tags each entry with its scope. Precedence picks local over project over user over plugin over managed. Approval lists apply to project entries only. Shadowed entries are reported under the winner. |
| `resources/plugins.ts` | A toggle changes only `enabledPlugins`; every other byte of `settings.json` is identical after the write, modulo formatting. |
| `resources/settings.ts` | Schema errors come back with a JSON path and the save still succeeds. Invalid JSON gives `422` and writes nothing. A missing `settings.local.json` reads as `exists: false`, not an error. |
| `resources/files.ts` | Each kind lists the right directory per scope. Fixed-name kinds (memory, keybindings) report `exists: false` when missing. |

## Frontend

No unit tests in v1. One Playwright smoke test after the UI is in: load, edit the global memory
file, save, see the diff. It runs against `bun run start` with a temp `HOME`.

## Open questions

None.
