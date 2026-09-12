# Plan discipline

> **Always-on rule.** Applies whenever you write, update, or finish an implementation plan.

Implementation plans (from the `writing-plans` skill or hand-authored) are **working scaffolding
for turning a design into code** — not source-of-truth. The durable record of a feature is its
**code + ADRs + specs + git history**, never the plan.

## Location

- One plan per feature: **`docs/plans/YYYY-MM-DD-<feature-slug>.md`**.
- Nowhere else: not `docs/superpowers/`, not an untracked scratch file.

## Committed, not untracked

- **Commit the plan** on the feature branch. A plan often spans several commits or PRs;
  committing it keeps it shared and stops it being lost on a branch switch.
- Keep it current as work lands — check off steps, adjust tasks.

## Ephemeral — delete when the work lands

- **Delete the plan when its feature is complete** — in the final commit of the feature or a
  dedicated cleanup commit. A lingering plan reads as "current work" and bloats the tree.
- **Before deleting, re-home anything durable** the plan established:
  - a decision (with real trade-offs) → an **ADR** (`docs/adr/`);
  - current-state design → the owning **spec** (`docs/spec/`);
  - deferred work → `docs/nice-to-have.md`.

## Not a spec, not an ADR

A plan describes *how to build* (task-by-task, test-first). It does not state current truth
(that is a spec) or record a decision (that is an ADR). If you catch a plan doing either, move
that content to its proper home rather than leaving the plan as a shadow source-of-truth.
