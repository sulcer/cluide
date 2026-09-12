# Spec discipline

> **Always-on rule.** Triggered any time a feature is being designed or implemented.
>
> Adopted in `docs/adr/2026-09-12-adopt-living-specs-and-adrs.md`.

Specs are the **source-of-truth artefacts** for a feature. They state the **current** design as
fact. A spec is always edited to read as the current state — never a frozen snapshot you
reconstruct by replaying ADRs on top of it.

## Structure: `docs/spec/<feature-slug>/`

```
docs/spec/<feature-slug>/
├── README.md             (entry point: status, at a glance, scope, topic-file table)
├── <topic-1>.md
├── <topic-2>.md
└── <flow-name>.svg       (required for any flow — see "Flows must be SVG")
```

- **`<feature-slug>` is a semantic, kebab-case name** that mirrors the code it describes
  (`foundation` → repo root and `server/` core, `api` → `server/resources/`, `ui` → `src/`).
  No numeric prefix; numeric ids are for nothing here, dates are for ADRs and plans.
- **One topic per file.** When a section grows past ~one screen, promote it to its own file.
- **`docs/spec/README.md` is the root index** — one row per spec (name · status · build state ·
  one-line scope) plus a "Start here" reading path. Every new spec adds its row.

## Spec lifecycle: `Draft | Stable`

1. **Draft** — work-in-progress. Edit freely. **No ADR** for changes; git history is the record.
2. **Stable** — the design is settled and the code is about to be, or is being, built. The spec is
   still edited in place to stay current, **but every behaviour-changing edit also gets an ADR**,
   and the changed section carries a `Changes: <adr-file>` backlink.

You flip a spec to `Stable` deliberately, with the user's approval; do not infer it.

## Build state: `Built | Partial | Planned`

**Lifecycle is not build state.** `Stable` says the *design* is settled. It says nothing about
whether the code exists. So every spec file's `Status:` line carries a second field:

```
Status: <Draft|Stable> · <Built|Partial|Planned> · <date> · <one-sentence "what this is">
```

| Build state | Means |
|---|---|
| **Built** | Everything this document describes exists and runs. |
| **Partial** | Some of it ships, some does not. **The document must say which** — a one-line note under the `Status:` line, or an inline marker on the unbuilt part. |
| **Planned** | None of it is built yet. The document is a design. |

Two rules that make it worth having:

1. **A build state is a claim about the tree — check it before you write it.** Grep for the
   route, the function, the component.
2. **When you build something a spec described, flip its marker in the same PR.**

## A contract-shape change must schedule its code change

A **contract shape** is anything code must parse, emit or store: a request or response body in
`docs/spec/api/`, anything mirrored in `shared/api.ts`, the shape of a file cluide writes. A spec
edit that changes one must, in the same PR, either **carry the code change** or **record the debt**
as a task in the feature's open plan (`docs/plans/`) or an entry in `docs/nice-to-have.md`. The
spec may lead the code; it may not lead silently.

## Readability standard

Specs must be readable by a **human of any background**, not only by AI agents.

**One document, progressive disclosure.** Never split a topic into a "human" doc and a separate
"contract" doc — they drift. One document opens human-friendly and deepens into precision.

**Canonical page skeleton** (every spec file):

```
# <Title>
Status: Draft | Stable   ·   Built | Partial | Planned   ·   <date>   ·   <one-sentence "what this is">

## At a glance        — 3–5 plain sentences; the "if you read nothing else" box
## Diagram            — required when the page describes a flow (SVG); otherwise optional
## <Body sections>    — short, scannable; each opens with a plain-language line
## Open questions     — terse one-liners; "None." when empty
```

**Five readability rules:**

1. **Lead with the summary** (and the picture when there is one) — top-down, never bottom-up.
2. **Contracts as tables, not prose** — field and shape definitions are scannable tables.
3. **Define a term on first use** — no undefined jargon; expand every acronym.
4. **One-screen rule, hard** — a section past ~one screen is promoted to its own file.
5. **Plain language** (hard gate) — one idea per sentence; common words; active voice, present
   tense; a concrete example next to every abstract statement.

## Spec + ADR = full story (for Stable specs)

"Why does it work this way?" is answered by: read the spec (current truth) → follow its
`Changes:` ADR backlinks (the decision trail). If the spec and the code disagree, file an ADR to
reconcile. Do not silently let drift accumulate.

## Flows must be SVG

Any flow (request path, state machine, merge order, startup sequence) in a spec, ADR or README
**MUST** be an SVG diagram. A text description accompanies the diagram, never replaces it.

- File next to the doc: `flow-name.svg` (kebab-case, descriptive).
- Embed via `![Flow name](./flow-name.svg)`.
- Hand-written SVG is fine. Give it a white background rectangle so it reads in dark themes.
