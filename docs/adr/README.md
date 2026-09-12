# Architecture Decision Records

Every behaviour-changing decision in cluide, newest first. The format and the
`Supersedes` / `Amends` relations are defined in
[`.claude/rules/always-on/adr-discipline.md`](../../.claude/rules/always-on/adr-discipline.md).

**Read the relation column before trusting an ADR.** `accepted` does not mean *wholly* current —
an amended ADR keeps that status while some of its decisions have been reversed. Follow its
`Amended by:` link to find which.

| Date | ADR | Decision | Status | Relations |
|---|---|---|---|---|
| 2026-09-12 | [`2026-09-12-adopt-living-specs-and-adrs.md`](./2026-09-12-adopt-living-specs-and-adrs.md) | **Adopt living specs, ADRs after Stable and ephemeral plans.** Living specs in `docs/spec/<slug>/` state the current design as fact and carry `Draft \| Stable` plus `Built \| Partial \| Planned`; ADRs record decisions with real trade-offs once a spec is `Stable`; plans in `docs/plans/` are committed but deleted when the work lands; three always-on rules in `.claude/rules/` enforce the shapes. The single `docs/architecture.md` is decomposed into the `foundation`, `api` and `ui` specs and deleted. | accepted | — |
