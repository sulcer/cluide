# CLAUDE.md

cluide is a tiny local web UI to view and edit a Claude Code setup: the files under `~/.claude`,
`~/.claude.json`, and each project's `.claude/` and `.mcp.json`. This file is the rulebook entry
point. The rules live in [`.claude/rules/`](.claude/rules/) and load at session start.

If a rule here conflicts with your instinct, follow the rule and propose a change via an ADR.

## Source of truth, in this order

1. **`CLAUDE.md`** — this index.
2. **[`.claude/rules/`](.claude/rules/)** — the rules.
3. **[`docs/adr/`](docs/adr/README.md)** — accepted decisions. Immutable once accepted; supersede
   or amend with a new ADR, never delete.
4. **[`docs/spec/`](docs/spec/README.md)** — living specs stating the current design as fact.
   A `Stable` spec changes only together with an ADR.
5. **`docs/plans/`** — implementation plans. Committed, ephemeral, deleted when
   the work lands.

Deferred work goes to [`docs/nice-to-have.md`](docs/nice-to-have.md).

**Start at [`docs/spec/README.md`](docs/spec/README.md).**

## Stack

| Concern | Choice |
|---|---|
| API server | Bun, `Bun.serve`, TypeScript |
| Frontend build | Vite |
| UI | React 19, Tailwind v4, shadcn/ui, lucide icons |
| Routing | react-router |
| Validation | ajv against the SchemaStore schema for `settings.json` |
| Diff | `git diff --no-index` via `Bun.spawn` |
| Tests | `bun test` |

Full detail, repository layout and the reasoning: [`docs/spec/foundation/`](docs/spec/foundation/README.md).

## Process

- **Docs before code.** A spec is written and approved, flipped to `Stable`, and a plan exists
  in `docs/plans/` before implementation starts.
- **Backend before frontend.** The `api` spec is the contract both halves meet at. The `ui`
  spec's screens and the frontend plan wait for the UI design, which the user provides.
- **Git conventions** are the user's global ones: Conventional Commits without scope,
  `<type>/<slug>` branches, ask before every commit. Nothing repo-specific.

## Rules index

| File | Topic |
|---|---|
| [`.claude/rules/always-on/spec-discipline.md`](.claude/rules/always-on/spec-discipline.md) | `docs/spec/<slug>/` shape, `Draft \| Stable` lifecycle, `Built \| Partial \| Planned` build state, page skeleton, flows must be SVG |
| [`.claude/rules/always-on/adr-discipline.md`](.claude/rules/always-on/adr-discipline.md) | ADR format, sections, supersession and amendment, index row |
| [`.claude/rules/always-on/plan-discipline.md`](.claude/rules/always-on/plan-discipline.md) | Plans live in `docs/plans/`, committed but ephemeral |
