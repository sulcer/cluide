# Files resource

Status: Stable · Planned · 2026-09-12 · One generic resource for every text file cluide edits at a known location.

## At a glance

Memory files, rules, agents, skills, commands, hook scripts and keybindings are all "a text file at
a known place". They share one resource. A `kind` names the group and decides which directory is
listed per scope; `path` then addresses one file. The resource does no parsing. Frontmatter on
agents and skills is a UI concern.

## Kinds

| Kind | Global | Project | Lists |
|---|---|---|---|
| `memory` | `~/.claude/CLAUDE.md` | `<repo>/CLAUDE.md`, `<repo>/CLAUDE.local.md` | fixed names, `exists` may be false |
| `rules` | `~/.claude/rules/` | `<repo>/.claude/rules/` | `*.md` |
| `agents` | `~/.claude/agents/` | `<repo>/.claude/agents/` | `*.md` |
| `skills` | `~/.claude/skills/` | `<repo>/.claude/skills/` | `<name>/SKILL.md` per subdirectory |
| `commands` | `~/.claude/commands/` | `<repo>/.claude/commands/` | `*.md` |
| `hooks` | `~/.claude/hooks/` | `<repo>/.claude/hooks/` | every regular file |
| `keybindings` | `~/.claude/keybindings.json` | not applicable, `400` | fixed name, `exists` may be false |

A skill directory may hold more than `SKILL.md` (references, scripts). The listing shows only
`SKILL.md`; any other file under an allowed root is still readable and writable by `path`.

## Endpoints

| Method and path | Body | Response |
|---|---|---|
| `GET /api/files?scope&kind` | | `FileEntry[]` |
| `GET /api/file?path` | | `{ path, content, etag }` or `404` |
| `PUT /api/file` | `{ path, content, etag? }` | `{ etag, diff }` |
| `POST /api/file` | `{ path, content }` | `201 { etag }`; `409` if the file exists |
| `DELETE /api/file?path&etag` | | `204`; a backup is taken first |

`path` is absolute and must pass the allowlist in [`write-safety.md`](../foundation/write-safety.md)
for every method, reads included.

## Shapes

| `FileEntry` field | Type | Meaning |
|---|---|---|
| `name` | string | File name, or `<skill-name>/SKILL.md` for skills |
| `path` | string | Absolute path |
| `exists` | boolean | Always true for directory listings; may be false for fixed-name kinds |

## Open questions

None.
