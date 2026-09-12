# File map

Status: Stable · Planned · 2026-09-12 · Every path cluide reads or writes, per scope, and the paths it never touches.

## At a glance

Claude Code keeps its configuration in three places: a directory (`~/.claude/`), a state file
next to it (`~/.claude.json`), and a few files inside each project. cluide edits all three. The
tables below were verified on a real machine on 2026-09-12. "Kind" is the value the generic files
resource uses to name a group of text files; "resource" says which part of the [`api`](../api/README.md)
owns the path.

## Scopes

| Scope value | Means | Root |
|---|---|---|
| `global` | The user's own setup | `~/.claude/` and `~/.claude.json` |
| an absolute project path | One project's setup | that directory |

The project list is `Object.keys(projects)` in `~/.claude.json`. On the reference machine that is
44 paths, including the home directory itself. A project path not in that list is rejected.

## Global scope: `~/.claude/`

| Kind | Path | Format | Resource |
|---|---|---|---|
| memory | `CLAUDE.md` | markdown | files |
| rules | `rules/*.md` | markdown | files |
| agents | `agents/*.md` | markdown with frontmatter | files |
| skills | `skills/<name>/SKILL.md` | markdown with frontmatter | files |
| commands | `commands/*.md` | markdown | files |
| hooks | `hooks/*` | shell and python scripts | files |
| keybindings | `keybindings.json` | JSON | files |
| settings | `settings.json`, `settings.local.json` | JSON, SchemaStore schema | settings |
| plugins | `plugins/installed_plugins.json`, `plugins/known_marketplaces.json` | JSON | plugins, read only |
| plugins (toggle) | `settings.json` → `enabledPlugins["name@marketplace"]` | boolean | plugins |
| mcp (managed) | `settings.json` → `managedMcpServers` | JSON | mcp, read only |

Plugin code lives under `plugins/cache/<marketplace>/<plugin>/<version>/`. cluide reads
`.mcp.json` and `hooks/hooks.json` there to know what a plugin brings, and never writes there.

## Home root: `~/.claude.json`

Claude Code's live state file. It holds the user-scope `mcpServers` map, a `projects` map keyed by
absolute path, and a lot of internal state: caches, onboarding flags, cost counters.

- It is the **project list**.
- Only two slices are ever written: `mcpServers` (user scope) and `projects[path].mcpServers`
  (local scope).
- Every write re-reads the file, patches the slice, and writes the whole file through the write
  primitive. Unknown keys are preserved unchanged; only formatting is normalised to 2-space JSON.
- Claude Code rewrites this file often. Conflict detection is on the **slice**, not the file
  (see [`write-safety.md`](./write-safety.md)), so unrelated changes by Claude Code do not cause
  spurious conflicts.
- Known ceiling: between the read and the rename there is a window in which Claude Code can write
  the file, and its change to an unrelated key would be lost. Accepted for v1; see
  [`nice-to-have.md`](../../nice-to-have.md).

## Project scope: `<repo>/`

| Kind | Path | Resource |
|---|---|---|
| memory | `CLAUDE.md`, `CLAUDE.local.md` | files |
| rules | `.claude/rules/*.md` | files |
| agents, skills, commands | `.claude/agents/`, `.claude/skills/`, `.claude/commands/` | files |
| hooks | `.claude/hooks/*` | files |
| settings | `.claude/settings.json`, `.claude/settings.local.json` | settings |
| mcp (project) | `.mcp.json` | mcp |
| mcp (local) | `~/.claude.json` → `projects[path].mcpServers` | mcp |
| mcp approval | `.claude/settings.local.json` → `enabledMcpjsonServers`, `disabledMcpjsonServers` | mcp |

The approval keys are documented settings keys. Verified: every repo on the reference machine with
a `.mcp.json` records its approvals in `.claude/settings.local.json`; the same-named keys on
`~/.claude.json` → `projects[path]` exist but are empty leftovers and are never written.

## Never touched

| Path | Why |
|---|---|
| `~/.claude/projects/**` | Session transcripts (566 MB on the reference machine) and auto-memory. Activity and auto-memory are deferred; see [`nice-to-have.md`](../../nice-to-have.md). |
| `~/.claude/cache`, `debug`, `shell-snapshots`, `session-env`, `paste-cache`, `file-history`, `*.lock`, `*.log` | Claude Code internals. |
| `~/.claude/settings.json` → `mcpServers` | Present on the reference machine but neither in the schema nor documented as a definition location. Left alone; the settings screen surfaces it as an unknown property. |

## Open questions

None.
