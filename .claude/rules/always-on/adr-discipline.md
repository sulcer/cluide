# ADR discipline

> **Always-on rule.** Triggered any time a behaviour-changing change is being made.

Every **behaviour-changing change** to a `Stable` spec gets an ADR. Bug fixes that don't change
documented behaviour don't need one. `docs/adr/` stays empty until the first spec is `Stable`;
the one exception is the meta-ADR that adopted this system.

## Format: `docs/adr/YYYY-MM-DD-kebab-case-title.md`

Frontmatter:

```yaml
---
tags: <comma-separated tags>
status: accepted   # or: superseded
decision-date: YYYY-MM-DD
---
```

Required sections (in order):

1. **Title** (H1) — short, descriptive
2. **Members** — who decided. `@sulcer`, plus "with Claude Code" when it facilitated.
3. **Status** — `accepted` or `superseded`
4. **Context and Problem Statement** — what's wrong / what needs deciding
5. **Options considered** — alternatives explored, briefly
6. **Decision** — what was chosen, why
7. **Consequences** — implications, tradeoffs, follow-ups
8. **Out of scope** — intentionally deferred (optional)

## Length: the section list is a shape, not a quota

**Every section earns its place or gets one line.** A decision with two real options has a
two-entry "Options considered"; padding it to five invents alternatives nobody weighed. Cut:
filler sections, a closing summary that restates the Decision, background the linked spec
already states, and prose that narrates the diff instead of the reasoning behind it.

The test: an ADR is read months later by someone asking *"why is it like this?"*. Everything
that answers that question belongs; everything that doesn't is noise they have to read past.

## Superseding

When superseding an older ADR:

1. Set the old file's `status: superseded`.
2. Add a `Superseded by: <new-adr-file>` line **immediately after the H1** of the old ADR.
3. The new ADR has a `Supersedes: <old-adr-file>` reference in the same position.
4. **Never delete** an ADR.

## Amending — when only SOME decisions change

Supersession is all-or-nothing, and most changes are not. When a new ADR reverses one or two
decisions of an older multi-decision ADR while the rest stand, **amend** instead:

1. The old ADR **keeps `status: accepted`** — most of it is still current.
2. The old ADR gains `Amended by: <new-adr-file> (decision N)` immediately after its H1,
   naming which decisions changed.
3. The new ADR carries `Amends: <old-adr-file> (decision N)` in the same position.
4. Say explicitly which decisions **stand** — a reader must not have to diff two documents.

**The back-link is the part that gets forgotten, and it is the part that matters.** Without it
an amended ADR reads as fully current.

## Flows in ADRs

If the ADR covers a flow (request path, state machine, startup sequence), include an SVG
diagram. Text accompanies the diagram, never replaces it.

## Index

Every ADR adds a row to `docs/adr/README.md`, newest first: date, file link, the decision in
one paragraph, status, relations (`supersedes`, `amends`, `amended by`).
