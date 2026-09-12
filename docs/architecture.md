# cluide — Architecture

A tiny local web UI to view and edit a Claude Code setup. Runs on localhost, no auth, no database. Reads and writes the real files Claude Code uses.

Status: initial plan, 2026-09-12. Approach C (hybrid) chosen.

## 1. Principles

- **The files are the source of truth.** No cache, no DB. Every screen reads from disk on load and writes back to the same file Claude Code reads.
- **Every write is safe.** Backup, atomic rename, conflict detection, diff. One code path, no exceptions.
- **Scope is first-class.** Everything that exists at both user and project level takes a `scope` from day one.
- **Typed only where merging is needed.** Text files get one generic resource. Settings, MCP and plugins get typed resources because their view spans several files.
- **Localhost is not a trust boundary.** Writes are guarded against cross-site requests even though there is no auth.

## 2. Stack

| Layer | Choice | Why |
|---|---|---|
| API server | Bun 1.3, `Bun.serve`, TypeScript | Stdlib covers files, JSON, routing, spawning `git`. No Express. |
| Frontend build | Vite | shadcn CLI detects it, Tailwind is one plugin, mainstream path. |
| UI | React 19, Tailwind v4, shadcn/ui, lucide icons | Requested. shadcn requires React. |
| Routing | react-router | Per-screen URLs that carry the scope. |
| Validation | ajv | `settings.json` has a published JSON schema (SchemaStore, 142 properties). |
| Diff | `git diff --no-index` via `Bun.spawn` | Always present on a dev box; no diff library. |
| Tests | `bun test` for server modules | Playwright smoke later. |

Not used, on purpose: Next, TanStack Query, a form library, an ORM, a state library. Add when a concrete need appears.

## 3. Repository layout

```
cluide/
  package.json            # single package, scripts: dev, build, start, test
  vite.config.ts          # @tailwindcss/vite, proxy /api -> 127.0.0.1:8787 with changeOrigin
  tsconfig.json           # paths: @/* -> src/*, @shared/* -> shared/*
  components.json         # shadcn
  docs/architecture.md
  shared/
    api.ts                # request/response types = the API contract
  server/
    index.ts              # Bun.serve, route table, static dist/, --open, --port
    security.ts           # host + origin guard for mutating requests
    paths.ts              # roots, scope -> file paths, allowlist check
    fs.ts                 # readText, writeText (backup, atomic, etag, diff)
    schema.ts             # settings schema fetch, disk cache, ajv validate
    resources/
      projects.ts
      files.ts
      settings.ts
      mcp.ts
      plugins.ts
  src/
    main.tsx, App.tsx, router.tsx
    api/client.ts         # fetch wrapper: X-Cluide header, etag, error shape
    components/ui/        # shadcn (generated)
    components/           # AppSidebar, ScopeSwitcher, SaveBar, DiffView
    features/
      files/              # memory, rules, agents, skills, commands, hooks, keybindings
      settings/
      mcp/
      plugins/
```

Rules for growth: one folder per screen under `features/`; one module per resource under `server/resources/`; both sides import types only from `shared/api.ts`.

## 4. What it reads and writes

Verified on a real machine. "Kind" is the value the generic file resource uses.

### User scope (`~/.claude/`)

| Kind | Path | Format | Written by |
|---|---|---|---|
| memory | `CLAUDE.md` | markdown | files resource |
| rules | `rules/*.md` | markdown | files resource |
| agents | `agents/*.md` | markdown + frontmatter | files resource |
| skills | `skills/<name>/SKILL.md` | markdown + frontmatter | files resource |
| commands | `commands/*.md` | markdown | files resource |
| hooks | `hooks/*` | shell / python scripts | files resource |
| keybindings | `keybindings.json` | JSON | files resource |
| settings | `settings.json`, `settings.local.json` | JSON (schema) | settings resource |
| plugins | `plugins/installed_plugins.json`, `plugins/known_marketplaces.json` | JSON | read only |
| plugins (toggle) | `settings.json` → `enabledPlugins["name@marketplace"]` | bool | plugins resource |
| mcp (managed) | `settings.json` → `managedMcpServers` | JSON | read only, shown greyed |

### Home root (`~/.claude.json`)

Claude Code's live state file. It holds the global `mcpServers` map, a `projects` map keyed by absolute path (44 entries on the reference machine), and a lot of internal state (caches, onboarding flags, cost counters). Rules:

- It is the **project list**: `Object.keys(projects)` is what the scope switcher shows.
- Only two slices are ever written: `mcpServers` (user scope) and `projects[path].mcpServers` (local scope).
- Every write re-reads the file, patches the slice, and writes the whole file through the write primitive. Unknown keys are preserved unchanged; only formatting is normalised to 2-space JSON.
- Claude Code rewrites this file often. Conflict detection is on the **slice**, not the file (see §5.2), so unrelated changes by Claude Code do not cause spurious conflicts.
- Known ceiling: between the read and the rename there is a window in which Claude Code can write the file, and its change to an unrelated key would be lost. Accepted for v1. Upgrade path: re-read immediately before the rename and re-apply the slice, or take a file lock.

### Project scope (`<repo>/`)

| Kind | Path |
|---|---|
| memory | `CLAUDE.md`, `CLAUDE.local.md` |
| rules | `.claude/rules/*.md` |
| agents / skills / commands | `.claude/agents/`, `.claude/skills/`, `.claude/commands/` |
| settings | `.claude/settings.json`, `.claude/settings.local.json` |
| mcp | `.mcp.json` (shared, committed) plus `~/.claude.json` → `projects[path].mcpServers` (private) |
| auto-memory | `~/.claude/projects/<encoded path>/memory/` (later; encoding replaces `/` with `-`) |

### MCP merge

One server list per scope, each entry tagged with the scope it came from. Sources and scope names as documented at https://code.claude.com/docs/en/mcp:

| Scope | File | Editable |
|---|---|---|
| local | `~/.claude.json` → `projects[path].mcpServers` | yes |
| project | `<repo>/.mcp.json` | yes |
| user | `~/.claude.json` → `mcpServers` | yes |
| plugin | `.mcp.json` inside each installed plugin dir | no, shown greyed |
| managed | `~/.claude/settings.json` → `managedMcpServers` | no, shown greyed |

Precedence when the same name exists in several scopes, highest first: local, project, user, plugin, managed. The docs state: "Only the highest-precedence definition is used; fields are not merged across scopes." The merged view marks the winning entry and lists the shadowed ones under it.

Approval of `.mcp.json` servers: the keys `enabledMcpjsonServers`, `disabledMcpjsonServers` and `enableAllProjectMcpServers` live in settings files. Verified on the reference machine: every repo with a `.mcp.json` records its approvals in `<repo>/.claude/settings.local.json`, and the same-named keys on `~/.claude.json` → `projects[path]` are empty leftovers. The toggle reads the merged settings for the scope and writes to `<repo>/.claude/settings.local.json`, creating the file if needed. `~/.claude.json` is never written for approvals.

Not a source: `~/.claude/settings.json` → `mcpServers`. The reference machine has this key with four servers, but it is neither in the SchemaStore schema nor documented as a definition location. It is left alone; the settings screen surfaces it as an unknown property.

Editing an entry writes to the file it came from. Adding an entry asks for the target scope. Same-name collisions are shown, not silently merged.

## 5. Backend

### 5.1 Resources (approach C)

| Resource | Endpoint | Shape |
|---|---|---|
| projects | `GET /api/projects` | `[{ path, name, exists }]` |
| files | `GET /api/files?scope&kind` | `[{ name, path }]` |
| | `GET /api/file?path` | `{ content, etag }` |
| | `PUT /api/file` `{ path, content, etag }` | `{ etag, diff }` |
| | `POST /api/file` `{ path, content }` | create (409 if exists) |
| | `DELETE /api/file?path` | backup then remove |
| settings | `GET /api/settings?scope&file=settings\|local` | `{ json, etag, errors[] }` |
| | `PUT /api/settings` `{ scope, file, json, etag }` | `{ etag, diff, errors[] }` |
| | `GET /api/settings/schema` | cached SchemaStore schema |
| mcp | `GET /api/mcp?scope` | `[{ name, source, config, enabled, conflicts[] }]` |
| | `PUT /api/mcp` `{ scope, source, name, config, etag }` | `{ etag, diff }` |
| | `DELETE /api/mcp?scope&source&name` | |
| | `POST /api/mcp/toggle` `{ scope, name, enabled }` | `.mcp.json` servers only; writes `<repo>/.claude/settings.local.json` |
| plugins | `GET /api/plugins` | `[{ id, marketplace, version, enabled, path, hasMcp, hasHooks }]` |
| | `PUT /api/plugins` `{ id, enabled, etag }` | writes `enabledPlugins` |

Errors: `{ error: { code, message } }` with status. `400` bad input or path outside roots, `403` origin/host check failed, `404` file missing, `409` etag conflict or already exists, `422` invalid JSON on a file that must parse. Schema violations do not block a save: they come back in `errors[]` as warnings, because the SchemaStore schema can lag behind Claude Code releases and must not stop the user from using a new key.

The files resource is generic on purpose: memory, rules, agents, skills, commands, hooks and keybindings are all "a text file at a known location". `kind` only decides which directory to list and which file extensions to show.

### 5.2 The write primitive (`server/fs.ts`)

Every mutation, from every resource, goes through one function:

```
writeText(path, content, expectedEtag?) -> { etag, diff }
```

1. **Allowlist.** `realpath` the target, then check it against the roots. User scope: anything under `~/.claude`, plus `~/.claude.json`. Project scope: only the known relative paths for a kind under a project root listed in `~/.claude.json`: `CLAUDE.md`, `CLAUDE.local.md`, `.mcp.json`, and files under `.claude/`. Never "anywhere under the project", because the home directory itself is a registered project on the reference machine, which would make the allowlist all of `$HOME`. Anything else is `400`. Symlinks are resolved before the check.
2. **Conflict check.** `etag = sha256(currentContent)`. If the caller sent an etag and it does not match, `409` with the current content. Typed resources compute the etag over the **slice they manage** (for example `JSON.stringify(json.mcpServers)`), so Claude Code touching another key in the same file does not block the save.
3. **Backup.** Copy the current file to `~/.cluide/backups/<encoded path>/<ISO timestamp>` before writing. Keep the last 50 per file.
4. **Atomic write.** Write to `<path>.cluide-tmp` in the same directory, then `rename`. Claude Code may re-read `settings.json` mid-session; it never sees a half-written file.
5. **Diff.** `git diff --no-index --no-color <backup> <path>`, returned to the caller and shown in the UI. Exit code 1 means "differences", not failure.

JSON files are written with `JSON.stringify(value, null, 2)` plus a trailing newline. Key order is preserved by `JSON.parse`. Comments are not supported in any of these files, so nothing is lost.

### 5.3 Security (`server/security.ts`)

The threat: a page in the user's browser posts to `http://127.0.0.1:8787/api/file` and rewrites a hook script. Hooks are shell commands, so that is code execution. Guards, applied to every non-GET request:

- Listen on `127.0.0.1` only. Never `0.0.0.0`.
- `Host` header must be `127.0.0.1:<port>` or `localhost:<port>` (DNS rebinding).
- Request must carry `X-Cluide: 1`. Custom headers force a CORS preflight, and the server does not answer preflights, so browsers refuse to send cross-origin writes.
- `Origin`, when present, must equal the server's own origin or the Vite dev origin.

No CORS headers are ever emitted. In dev, Vite proxies `/api` so the browser only ever talks same-origin.

### 5.4 Schema (`server/schema.ts`)

On first request, fetch `https://www.schemastore.org/claude-code-settings.json`, cache it to `~/.cluide/schema-cache.json`, and serve from disk afterwards. Refresh when the cache is older than 7 days. If fetch fails and there is no cache, validation is skipped and the settings screen shows a "schema unavailable" badge. ajv compiles it once per process.

## 6. Frontend

### 6.1 Routes

```
/                              -> redirect /global/settings
/:scope/settings               scope = "global" | "p/<encodeURIComponent(path)>"
/:scope/memory
/:scope/rules
/:scope/agents
/:scope/skills
/:scope/commands
/:scope/hooks
/:scope/mcp
/global/keybindings
/global/plugins
```

The scope lives in the URL so deep links and browser back/forward work. `ScopeSwitcher` in the sidebar swaps the first segment and keeps the screen.

### 6.2 Screens

- **Layout.** shadcn `Sidebar`: scope switcher (Combobox over `/api/projects`) at the top, then nav groups Config, Extensions, MCP. Content area to the right. `Sonner` for toasts.
- **Files screens** (memory, rules, agents, skills, commands, keybindings). One component, `FileEditorScreen`, parameterised by `kind`. Left: file list from `/api/files`. Right: editor. v1 editor is a shadcn `Textarea` with monospace font. Frontmatter on agents and skills is shown as a small read-only summary above the editor.
- **Hooks.** What fires when lives in `settings.json → hooks`, not in the `hooks/` directory, so a bare script list would not show hooks. The screen reads the `hooks` key from the settings resource for the current scope and renders one row per event (PreToolUse, SessionStart, ...) with its matcher and command. A command that points at a local script links to that file in `FileEditorScreen`. Editing the mapping itself happens in the settings screen in v1; a structured hooks editor is item 1 in §10.
- **Settings.** JSON editor (Textarea) with live validation errors from the server listed below it, each pointing at a JSON path. Toggle between `settings.json` and `settings.local.json`. Structured sub-editors for hooks, permissions and model come after v1.
- **MCP.** Table of merged servers: name, source badge, transport (stdio or http), enabled switch for `.mcp.json` entries, conflict warning. Row click opens a `Sheet` with the JSON config for that one server. Add button asks for the target source.
- **Plugins.** Table: id, marketplace, version, enabled switch, badges for "has MCP" and "has hooks". Toggle writes immediately.

### 6.3 Save flow

`SaveBar` sits above every editor: dirty indicator, Save, Discard. Save sends the etag from load. On `409`, a dialog shows "changed on disk" with Reload and Overwrite. On success, a toast with "View diff" opens `DiffView` (a `Sheet` rendering the unified diff with added/removed line colouring). `beforeunload` warns when dirty.

### 6.4 State and data

No global store. Each screen owns its data with a small `useResource(url)` hook (`{ data, etag, error, reload }`) over `fetch`. `src/api/client.ts` adds the `X-Cluide` header, unwraps the error shape, and throws typed errors. Types come from `shared/api.ts` so a server change breaks the frontend at compile time.

## 7. Dev and run

```
bun install
bun run dev        # bun --hot server/index.ts  &  vite   (Vite on 5173 proxies /api -> 8787, changeOrigin: true so the Host check in §5.3 passes)
bun run build      # vite build -> dist/
bun run start      # bun server/index.ts --open   (serves dist/ with SPA fallback + /api, opens browser)
bun test           # server module tests
```

Flags on the server: `--port` (default 8787), `--open`. Later: `bun build --compile` for a single binary.

## 8. Error handling

- The server never throws raw. Every route returns the error shape from §5.1.
- Reading a missing optional file (no `settings.local.json`, no `.mcp.json`) is not an error: the resource returns an empty result and the UI offers Create.
- Invalid JSON in a file Claude Code owns is shown, not hidden: the settings and MCP screens fall back to a raw editor with the parse error, so the user can repair it.
- Backup failure aborts the write. A write that cannot be backed up does not happen.

## 9. Testing

`bun test` with a temp `HOME` per test, so tests never touch the real `~/.claude`.

- `fs.ts`: allowlist rejects traversal and symlink escape; atomic write leaves no temp file; etag mismatch returns 409 and does not write; backup exists after write; diff is returned.
- `mcp.ts`: merge tags each entry with its scope; precedence picks local over project over user over plugin; enabled/disabled lists apply; shadowed entries are reported.
- `plugins.ts`: toggle changes only `enabledPlugins`, everything else in `settings.json` is byte-identical after write.
- `settings.ts`: schema errors reported with JSON path and the save still succeeds; invalid JSON yields 422 and does not write.
- `security.ts`: missing `X-Cluide`, wrong `Host`, foreign `Origin` each yield 403 on PUT and pass on GET.

Tests assert on whole payloads, not individual fields.

Frontend: no unit tests in v1. One Playwright smoke test (load, edit memory, save, see diff) once the UI settles.

## 10. Scope

**v1**

- Files screens: memory, rules, agents, skills, commands, hooks, keybindings
- Settings with schema validation
- MCP merged view with edit, add, delete, toggle
- Plugins list with enable/disable
- User and project scope
- Backup, atomic write, conflict detection, diff on save

**Later, in rough order**

1. Structured settings editors (hooks table, permissions lists, model picker)
2. Health: run validation across all files, show issues; edit history browser over `~/.cluide/backups`
3. Auto-memory per project (`~/.claude/projects/<encoded>/memory/`)
4. CodeMirror for syntax highlighting if the Textarea starts to hurt
5. Activity: sessions, tokens, cost from `~/.claude/projects/**/*.jsonl` (566 MB on the reference machine; needs an incremental index, which is why it is not in v1)
6. Single-binary distribution via `bun build --compile`

## 11. Decisions log

| Decision | Choice | Alternative rejected |
|---|---|---|
| Config model | Hybrid: generic files + typed settings/mcp/plugins | Files-only (merging leaks to client), resources-only (overkill for text) |
| Bundler | Vite | Bun HTML imports (works, but shadcn CLI and ecosystem assume Vite) |
| Conflict detection | Content etag, per managed slice for typed resources | mtime (unreliable across editors), whole-file etag (spurious 409 from `~/.claude.json` churn) |
| Diff | `git diff --no-index` | diff library (a dependency for something git already does) |
| Backups | `~/.cluide/backups`, last 50 per file | inside `~/.claude/backups` (that dir belongs to Claude Code) |
| Write guard | Custom header + Host + Origin | Token auth (more UX for the same protection on localhost) |
| Routing | react-router with scope in the URL | hash state (no deep links, awkward once screens multiply) |
| Data fetching | `fetch` + `useResource` hook | TanStack Query (no caching need; files are read fresh on purpose) |
