# Settings screen

Status: Stable · Partial · 2026-09-15 · The two settings files of a scope in a JSON editor with a warnings panel.

## At a glance

Two tabs, `settings.json` and `settings.local.json`, over one editor. The editor is the textarea and
save bar from [`editing.md`](./editing.md); saving is `PUT /api/settings` with the whole document.
To the right, a 320px Warnings panel lists what the server's schema validation returned, with a count
badge and a note when the schema could not be fetched. Warnings never block a save. A file that does
not parse stays editable as raw text under a red banner. A tab for a file that does not exist offers
to create it.

## Tabs row

40px, padding 0 16px, gap 16px, 1px bottom border. Each tab is the file name in mono 12px; the
active tab has `--foreground` text and a 2px `--foreground` underline overlapping the border;
inactive tabs are muted, hover foreground. A tab whose file has `exists: false` shows `missing` after
the name in 11px muted Inter. The save bar sits at the right of the same row.

## Editor column

- A 32px path row, mono 12px muted, 1px bottom border: the file's absolute path.
- **Unparsable banner**, when the read returned `raw`: margin 12px 16px 0, padding 6px 10px, 1px
  `--destructive` border, radius 6px, 12px destructive text: `CircleAlert`, the file name in mono,
  `does not parse. Fix it and save.`, a spacer, and the parser position in mono at 80% opacity,
  `line 18 · unexpected token }`, taken from `JSON.parse`'s message in the browser. The textarea
  shows `raw`; saving it goes through `PUT /api/file` with the text, since the settings resource
  refuses a `PUT` over an unparsable file.
- The textarea, mono 12.5px / 20px, holds the document pretty-printed with two spaces as the server
  returns it.

## Warnings panel

320px, 1px left border, flex column. Below a 1200px viewport it moves under the editor, full width,
180px tall, 1px top border.
*Changes: [2026-09-13-frontend-build-reconciliations.md](../../adr/2026-09-13-frontend-build-reconciliations.md)*

- Header 32px, padding 0 12px, 12px 500: `Warnings`, the count badge (`--secondary` with `--foreground` text
  above zero, `--muted` at zero), then when the read carried `schema: "unavailable"` a dashed badge
  with `TriangleAlert` and `Schema unavailable`, tooltip `Last fetch failed. Validated against the
  cached copy.`; a spacer; and `schemastore.org` in 11px muted, hidden when the badge shows.
- Zero warnings: padding 16px 12px, `Check` in `--success`, `Valid against the published schema`
  in 12px muted.
- Rows, one per `SchemaError`: padding 6px 12px, 1px bottom border, the JSON pointer in mono 12px on
  the first line, the message in 12px muted on the second, hover `--accent`. Clicking a row moves the
  textarea's caret to the first occurrence of the pointer's last key, quoted, and scrolls to it.

The warnings shown are the `errors` from the last read or the last successful save.

## States

| State | What shows |
|---|---|
| Missing file (`exists: false`) | The editor column centred: `<file> does not exist in this scope` in 500, the path in mono 12px muted, a primary `Create <file>`. Create opens the editor dirty with `{`, an empty indented line and `}`; the first save `PUT`s it. |
| Three warnings | Count badge `3`, rows `/hooks/PreToolUse/0/matcher · must be string`, `/modelSettings · not a documented setting`, `/mcpServers · not a documented setting`. Save stays enabled. |
| Schema unavailable | The dashed badge next to the count; rows may be empty. |
| Unparsable | The red banner over the raw text; the panel shows zero warnings because validation needs a parse. |

## Open questions

None.
