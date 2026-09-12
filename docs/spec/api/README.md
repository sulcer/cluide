# API

Status: Stable · Planned · 2026-09-12 · The HTTP contract between the Bun server and the page, and the conventions every resource follows.

## At a glance

The page never touches a file. It calls `/api` on the same origin and the server does the reading
and writing. There are five resources. One is generic: `files`, for any text file at a known
location. Four are typed, because their view spans more than one file: `projects`, `settings`,
`mcp`, `plugins`. This document holds the conventions; each resource has its own file with its
endpoints, shapes and errors. `shared/api.ts` mirrors these shapes in TypeScript; when they
disagree, this spec wins and the code is fixed.

Decided in: [`2026-09-12-hybrid-config-model.md`](../../adr/2026-09-12-hybrid-config-model.md).

## Conventions

| Convention | Rule |
|---|---|
| Base path | `/api`. Request and response bodies are JSON. |
| Scope | `scope` is `"global"` or an absolute project path, URL-encoded in query strings, plain in bodies. A project path must be a key of `projects` in `~/.claude.json`; otherwise `400`. |
| Mutating requests | `PUT`, `POST`, `DELETE` carry `X-Cluide: 1` and pass the guards in [`security.md`](../foundation/security.md). |
| Etags | Hex SHA-256 of the content a resource manages. Every read returns one. Every `PUT` and `DELETE` sends it back. Mismatch is `409`. A client may omit the etag to force a write, which the UI does only after the user chooses "overwrite" in the conflict dialog. |
| Missing optional file | Not an error. The read returns `exists: false` and the UI offers Create. Files that must exist (a plugin's registry) are `404` when missing. |
| Writes | All go through [`write-safety.md`](../foundation/write-safety.md). Every successful write returns `{ etag, diff }`, where `diff` is a unified diff string, empty when nothing changed. |

## Errors

```json
{ "error": { "code": "conflict", "message": "settings.json changed on disk", "current": { } } }
```

| Status | `code` | When |
|---|---|---|
| 400 | `bad_request` | Malformed body, unknown scope, unknown kind, path outside the allowlist |
| 403 | `forbidden` | A guard in `security.ts` failed |
| 404 | `not_found` | A required file or entry does not exist |
| 409 | `conflict` | Etag mismatch (`current` carries the on-disk content and its etag), or Create on a path that exists |
| 422 | `unprocessable` | A file that must parse as JSON does not |
| 500 | `internal` | Backup or write failed; nothing was changed |

The server never throws raw. Every route returns this shape.

## Resources

| Resource | File | Owns |
|---|---|---|
| projects | [`projects.md`](./projects.md) | The list of known projects, from `~/.claude.json` |
| files | [`files.md`](./files.md) | Text files by kind: memory, rules, agents, skills, commands, hooks, keybindings |
| settings | [`settings.md`](./settings.md) | `settings.json` and `settings.local.json` per scope, with schema validation |
| mcp | [`mcp.md`](./mcp.md) | The merged MCP server list per scope, with edit, add, delete and approval. Flow SVG inside. |
| plugins | [`plugins.md`](./plugins.md) | Installed plugins and their enabled state |

## Open questions

None.
