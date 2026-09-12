# Settings resource

Status: Draft · Planned · 2026-09-12 · Reading and writing `settings.json` and `settings.local.json` per scope, with schema validation.

## At a glance

Each scope has two settings files: a shared one and a local one. Both follow the same schema,
published on SchemaStore with 142 properties. The resource reads the file, parses it, validates it,
and returns the parsed JSON with any schema warnings. A save writes the whole file back. Schema
warnings never block a save, because the published schema can lag behind a Claude Code release and
must not stop the user from using a new key. Invalid JSON does block a save.

## Files per scope

| `file` | Global | Project |
|---|---|---|
| `settings` | `~/.claude/settings.json` | `<repo>/.claude/settings.json` |
| `local` | `~/.claude/settings.local.json` | `<repo>/.claude/settings.local.json` |

## Endpoints

| Method and path | Body | Response |
|---|---|---|
| `GET /api/settings?scope&file` | | `SettingsDoc` |
| `PUT /api/settings` | `{ scope, file, json, etag? }` | `{ etag, diff, errors }` |
| `GET /api/settings/schema` | | The JSON schema, from the disk cache |

## Shapes

| `SettingsDoc` field | Type | Meaning |
|---|---|---|
| `path` | string | The file's absolute path |
| `exists` | boolean | False when the file is absent; `json` is then `null` |
| `json` | object or null | The parsed document. When the file exists but does not parse, `json` is `null` and `raw` holds the text so the UI can offer a repair editor |
| `raw` | string, optional | Present only when the file does not parse |
| `etag` | string or null | Hash of the whole file |
| `errors` | `SchemaError[]` | Empty when valid or when the schema is unavailable |

| `SchemaError` field | Type | Meaning |
|---|---|---|
| `path` | string | JSON pointer to the offending value, `/hooks/PreToolUse/0` |
| `message` | string | ajv's message |

## Validation

`server/schema.ts` fetches `https://www.schemastore.org/claude-code-settings.json` on first use,
caches it at `~/.cluide/schema-cache.json`, and refreshes when the cache is older than 7 days. If
the fetch fails and there is no cache, `errors` is empty and the response carries
`schema: "unavailable"` so the UI can show a badge. ajv compiles the schema once per process.

The reference machine's `~/.claude/settings.json` has an `mcpServers` key that is not in the
schema. It shows up as an unknown-property warning, which is the intended behaviour: the user sees
it, cluide does not touch it.

## Errors specific to this resource

| Status | When |
|---|---|
| `422 unprocessable` | The body's `json` is not an object, or the on-disk file does not parse and the client sent `json` rather than repairing `raw` through the files resource |

## Open questions

None.
