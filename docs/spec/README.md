# Specs

This is the index of every spec in cluide. A spec states the **current** design as fact and is
always edited to read as the current state — never a frozen snapshot. Each spec carries **two**
markers: a lifecycle `Status` (`Draft` or `Stable`) and a **build state** (`Built`, `Partial`,
`Planned`). The first says how settled the *design* is, the second how much of it *exists*. See
[`spec-discipline.md`](../../.claude/rules/always-on/spec-discipline.md).

## Index

| Spec | Status | Built | Scope |
|---|---|---|---|
| [`foundation`](./foundation/README.md) | Draft | Planned | The stack, repository shape, the files cluide reads and writes, the write primitive, security, dev and build, testing. Everything both halves stand on. |
| [`api`](./api/README.md) | Draft | Planned | The HTTP contract between the Bun server and the page: conventions, then one file per resource — projects, files, settings, mcp, plugins. |
| [`ui`](./ui/README.md) | Draft | Planned | The page: routes, data flow, save experience. The screens section waits for the UI design. |

## Start here

**New to the project:** read [`foundation`](./foundation/README.md) top to bottom, then
[`file-map.md`](./foundation/file-map.md) so you know which real files are being edited.

**Building the backend:** [`api/README.md`](./api/README.md) for the conventions, then the
resource file you are implementing, then [`write-safety.md`](./foundation/write-safety.md) and
[`security.md`](./foundation/security.md), which every write goes through.

**Building the frontend:** [`ui`](./ui/README.md), then the `api` resource files it calls.
