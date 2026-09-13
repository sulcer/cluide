# Hooks screen

Status: Stable · Built · 2026-09-12 · What fires when, read from settings, with links into the scripts.

## At a glance

Hooks are the `hooks` key of the settings files, not the files in the `hooks/` directory. The
screen reads both settings files of the scope through the settings resource, `settings.json` then
`settings.local.json`, and shows one row per configured hook: event, matcher, command, type. A
command that points at a script in this scope's `hooks/` directory links to that script in the
editor at `/<scope>/hooks/<file>`. Under the table, the scripts in the directory are listed for
direct access. The mapping itself is edited in the settings screen; this screen is for reading and
jumping.

## Table

`table-layout` auto, 13px. Header cells 32px, padding 0 16px, 12px 500 muted, 1px bottom border.
Columns: Event 180px, Matcher 140px, Command auto, Type 120px. Rows 36px, 1px bottom border, hover
`--accent`.

| Column | Content |
|---|---|
| Event | The settings key: `PreToolUse`, `UserPromptSubmit`, `SessionStart`, and so on, weight 500 |
| Matcher | The entry's `matcher`, mono 12px; `*` when absent |
| Command | The hook's `command`, mono 12px in `--link` with an `ArrowRight`, ellipsis at 520px, tooltip with the full value. Links to the editor when the command resolves to a file in this scope's `hooks/` directory; plain text otherwise |
| Type | The hook's `type`, mono 12px muted |

One row per hook inside each matcher entry, so an entry with two hooks makes two rows. Rows are in
file order, `settings.json` first.

Under the table, a 28px line in 12px muted: `Read from <file>` naming each settings file that had a
`hooks` key, `· edit the mapping in` `Settings`, the last word a link to `/<scope>/settings`.

## Scripts list

Padding 20px 16px 16px, max width 480px. A 24px label `Scripts in hooks/` in 12px 500 muted, then
one 28px row per file from `GET /api/files?scope&kind=hooks`: `FileCode` icon muted, the name in
mono 12px, and on the right the language in 11px muted, taken from the extension: `python` for
`.py`, `bash` for `.sh`, otherwise the extension. Click opens the editor.

## States

| State | What shows |
|---|---|
| No `hooks` key in either file | Centred: `No hooks in this scope` in 500, then `Hooks are the` `hooks` `key of` `settings.json` in 12px muted, `hooks` in mono, `settings.json` a link to the settings screen. |
| Both settings files missing | Same as above. |

## Open questions

None.
