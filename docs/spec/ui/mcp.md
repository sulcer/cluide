# MCP servers screen

Status: Stable · Partial · 2026-09-15 · The merged server list, the server sheet, the add dialog, and approval.

## At a glance

One table from `GET /api/mcp?scope`, one row per definition, tagged with a scope badge. The entry
that wins precedence for a name reads `Effective`; the ones it shadows sit under it, dimmed, with a
`↳` marker and `Shadowed by <scope>`. Plugin and managed rows carry a lock and open a read-only
sheet. Project rows carry the approval switch. Clicking a row opens a sheet with the JSON config and
the save bar; `Add server` in the header opens a dialog that writes to the chosen file.

## Table

`table-layout: fixed`, 13px. Header cells 32px, 12px 500 muted, 1px bottom border. Rows 36px, 1px
bottom border, `cursor: pointer`, hover `--accent`, the row whose sheet is open has `--accent` and the
inset bar.

| Column | Width | Content |
|---|---|---|
| Name | auto, padding 0 16px | For a shadowed entry a `CornerDownRight` muted first; the name in 500; a `Lock` muted after it on plugin and managed rows, tooltip `Read-only` |
| Scope | 96px | The scope badge from [`tokens.md`](./tokens.md): `local`, `project`, `user`, `plugin`, `managed` |
| Transport | 88px | `stdio`, `http` or `sse` in mono 12px, derived from `config.type` or the presence of `command` |
| Command or URL | auto, padding 0 12px | `command` plus `args` joined by spaces, or `url`, mono 12px muted, ellipsis, tooltip with the full value |
| Approved | 96px | The switch, only on `project` rows, on when `enabled` is true |
| Status | 160px, padding 0 16px 0 12px | `Effective` in foreground, or `Shadowed by <scope>` in muted |

Rows are grouped by name and sorted by name; within a name, by precedence, so the winner is first.
Shadowed rows are at 50% opacity. Under the table a 32px line in 11px muted:
`<n> effective · <m> shadowed · precedence local › project › user › plugin › managed`.

Above the table, one line per entry in the list's `errors`, in the shape of the settings screen's
parse banner: 12px `--destructive` text on a 1px `--destructive` border, radius 6px, margin 12px 16px
0, `CircleAlert`, the file's basename in mono, `does not parse`, and the message in mono at 80% on
the right. The parsed entries render under it as usual. *Planned; `Changes:`
[`2026-09-15-pre-release-refinements.md`](../../adr/2026-09-15-pre-release-refinements.md).*

At 1024px the Command column truncates and nothing scrolls horizontally.

## Approval switch

Flipping it calls `POST /api/mcp/approval` with the scope, the name and the new value, updates the
row, and toasts `Approved <name>` or `Approval removed for <name>` with the local settings file path
as description. The click does not open the sheet.

## Server sheet

A right Sheet, 520px, like the diff sheet. Header padding 14px 16px 12px: the name in 500, the scope
badge, a `Read-only` pill with a `Lock` for plugin and managed entries, then the source file path in
mono 12px muted, and a 28×28 `X`. A 36px row with `Config` in 12px muted and the save bar. The
textarea, mono 12.5px / 20px, holds `config` pretty-printed with two spaces; for read-only entries
it is disabled at 60% opacity and a note follows in 12px muted: `Defined by the plugin. Disable the
plugin to remove it.` or `Managed by your organisation in settings.json → managedMcpServers.`

Footer padding 12px 16px, 1px top border: for editable entries a ghost destructive `Delete` with a
`Trash2`; a spacer; a secondary `Close`. Save parses the textarea and calls `PUT /api/mcp` with the
scope, the entry's scope as `target`, the name, the config and the entry's etag; an unparsable
textarea shows the inline error `422 · config must be valid JSON` without calling the server. Delete
opens the delete dialog and then `DELETE /api/mcp`. `Esc` closes the sheet; a dirty sheet is
discarded without asking.

## Add dialog

Dialog 480px. Header padding 16px 16px 12px, 1px bottom border: `Add server` in 14px 600 and
`Writes to <file>` in 12px muted, the file following the chosen target. Body padding 16px, fields
14px apart, labels 12px 500:

- **Name**: a 32px mono input, placeholder `my-server`, focus on open.
- **Target**, hidden in global scope where the target is `user`: a segmented control on `--muted`,
  padding 2px, radius 6px; three 40px two-line buttons, label 12px 500 over the file in mono 10px
  muted: `User` `~/.claude.json`, `Project` `.mcp.json`, `Local` `this project only`. The selected
  one has `--background` and a small shadow. A hint in 11px muted under it: `Available in every
  project.`, `Committed with the repo. Teammates approve it on first run.`, `Only you, only here.`
  Default `project` in a project scope.
- **Transport**: a 240px segmented control of `stdio`, `http`, `sse` in mono 12px, 26px buttons.
- For `stdio`: **Command**, a mono input with placeholder `npx`; **Args** `one per line`, a mono
  textarea of three rows.
- For `http` and `sse`: **URL**, a mono input with placeholder `https://mcp.example.com/mcp`;
  **Headers** `Name: value, one per line`, a mono textarea of three rows.

Footer, right-aligned: secondary `Cancel`, primary `Add server` with a `⌘↵` kbd, disabled at 50%
opacity until a name and a command or URL are present. Submit builds the config, `{ command, args }`
or `{ type, url, headers }` with empty parts omitted, calls `PUT /api/mcp`, closes, reloads the list,
and toasts `Added <name>` with the file written. A failed save keeps the dialog open and shows
`Save failed · <status> · <message>` in 12px `--destructive` under the fields; no toast, since an open
dialog hides one from assistive technology. *Planned; `Changes:`
[`2026-09-15-pre-release-refinements.md`](../../adr/2026-09-15-pre-release-refinements.md).*

## Open questions

None.
