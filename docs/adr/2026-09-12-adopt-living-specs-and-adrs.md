---
tags: docs, spec, process
status: accepted
decision-date: 2026-09-12
---

# Adopt living specs, ADRs after Stable, and ephemeral plans

## Members

- @sulcer (deciding)
- Claude Code (facilitating)

## Status

`accepted`

## Context and Problem Statement

cluide starts as an empty repository with one approved design document, `docs/architecture.md`,
written in a single brainstorming session. The project is meant to grow: backend first, frontend
after a separate UI design lands, and a second wave of features (health checks, activity, single
binary) after that. One document cannot carry that:

1. It mixes current truth with decision history. A reader who asks "why Vite and not Bun's own
   bundler?" and a reader who asks "what does the MCP screen show?" read the same file.
2. It has no lifecycle. Nothing says whether a section is settled, being built, or built.
3. It has no place for a decision that reverses an earlier one without rewriting history.
4. Implementation plans have no home, so they either pollute the design doc or live untracked.

The shape that solves this is well known: living specs for what is true now, decision records for
why, throwaway plans for how. cluide adopts it on day one rather than growing into it after the
single document has already drifted.

## Options considered

- **One `architecture.md`, kept current.** Simplest. Rejected: one blob with no lifecycle marker,
  no build-state marker, and decisions and current state interleaved. This is the file we have,
  and its problems are listed above.
- **ADRs only.** Every decision is a dated record; current truth is reconstructed by replaying
  them. Rejected: reconstruction is the reader's job, and it gets worse with every ADR.
- **Living specs + ADRs after Stable + ephemeral plans** (**chosen**).
  Specs state current truth and are edited in place. ADRs carry the "why" only for decisions with
  real trade-offs, and only once a spec is `Stable`. Plans are scaffolding that is deleted when the
  work lands. Rules in `.claude/rules/` make the shapes enforceable by any agent.

## Decision

Adopt a living-spec documentation system sized to cluide.

1. **Living specs in `docs/spec/<slug>/`**, one topic per file, each with
   `Status: Draft | Stable · Built | Partial | Planned · <date> · <one sentence>`. The slug
   mirrors the code it describes: `foundation` (repo root and `server/` core), `api`
   (`server/resources/`, the contract both halves meet at), `ui` (`src/`).
2. **ADRs only after `Stable`.** A `Draft` spec changes freely, git history is the record. Once a
   spec is `Stable`, every behaviour-changing edit gets an ADR and a `Changes:` backlink. This
   meta-ADR is the single exception, because it changes the convention, not a spec.
3. **Plans in `docs/plans/YYYY-MM-DD-<slug>.md`**, committed, ephemeral, deleted when the work
   lands after re-homing anything durable.
4. **Three always-on rules** in `.claude/rules/always-on/`: `spec-discipline`, `adr-discipline`,
   `plan-discipline`. `CLAUDE.md` indexes them and states the source-of-truth order.
5. **Decompose and delete `docs/architecture.md`.** Its sections move to `foundation` (principles,
   stack, layout, file map, write safety, security, dev and build, testing), `api` (endpoints and
   errors, one file per resource), `ui` (routes, data flow, save UX; screens wait for the design),
   and `docs/nice-to-have.md` (the deferred list). Two homes for one topic drift, so the original
   goes.
6. **Not included yet:** a glossary, an `AGENTS.md` twin of `CLAUDE.md`, path-scoped code rules,
   `docs/how-tos/`. Each is added when there is content for it.

## Consequences

- Every design question has one home. "What is it?" → spec. "Why?" → ADR. "How do we build
  it?" → plan.
- Flipping `foundation` and `api` to `Stable` is a deliberate step after review; the four
  decisions with real trade-offs (hybrid config model, Vite over Bun HTML imports, write safety,
  cross-site write guard) become ADRs right after that flip.
- `docs/adr/` holds only this ADR until then.
- Flows must be SVG. cluide has three: system overview, the save path, the MCP merge.
- `docs/architecture.md` exists only in git history from this commit on.

## Out of scope

- The `ui` spec's screens section, which waits for the UI design.
- `docs/how-tos/`, until there is a how-to worth writing.
- Path-scoped code rules (naming, error handling, testing style) — added once there is code and a
  convention worth enforcing.
