---
tags: tooling, formatting, linting
status: accepted
decision-date: 2026-09-13
---

# Biome formats and lints the tree

## Members

- @sulcer (deciding)
- Claude Code (facilitating)

## Status

`accepted`

## Context and Problem Statement

Until now the only gates were `tsc` and the tests. Style drifted where no tool held it: import
order differed between files, comments grew into paragraphs, lines ran to 200 columns. The
question is which formatter and linter to adopt, and how far to bend it to the code as written.

## Options considered

- **ESLint and Prettier.** The most common pair. Rejected: six dev dependencies (`eslint`,
  `typescript-eslint`, `eslint-plugin-react-hooks`, a React refresh plugin, `prettier`,
  `eslint-config-prettier`) and two configurations for what one tool does here.
- **oxlint and oxfmt.** The fastest, and oxlint is stable. Rejected for now: oxfmt is pre-1.0
  (0.67 at decision time), and it is still two tools with two configurations.
- **Biome** (**chosen**). One dev dependency, one `biome.json`, one binary that formats and lints
  TypeScript, JSX, JSON and CSS, sorts imports, and ships the React hooks rules.

## Decision

Biome 2.5, pinned exactly like every other dependency. `bun run lint` is
`biome check --error-on-warnings .`, so a passing run is silent; `bun run format` is
`biome check --write .`, which applies formatting, import order and the safe lint fixes. Spec:
[`dev-and-build.md`](../spec/foundation/dev-and-build.md).

Where the recommended rules contradict a pattern the code uses on purpose, the rule bends. This
table is the record of why:

| Setting | Why |
|---|---|
| `lineWidth: 120`, two-space indent | The code is dense JSX and long template strings; the default 80 would wrap most of it. |
| `**/*.svg` excluded | The SVGs are the specs' diagrams, not code. |
| `css.parser.tailwindDirectives` | `globals.css` is Tailwind v4. |
| `useExhaustiveDependencies` with `reportUnnecessaryDependencies: false` | Several effects key on a trigger (`url`, `tick`, `location.key`) they never read; the rule cannot express that. |
| `noArrayIndexKey` off | Every list is rebuilt wholesale from a response and never reordered, so the index is the identity. |
| `noExplicitAny` off | `any` is used for one thing: the untyped JSON documents the server patches in place. |
| `noNonNullAssertion` off | Every `!` sits where TypeScript cannot narrow: a `find` result, a closure after a guard. |
| Six `biome-ignore` comments, each with its reason | Four effects that read more than they list on purpose, one `autoFocus` on an input the user just asked for, one cell `onClick` that only stops a row click. |

## Consequences

- One reformat commit touches most files; blame on those lines points at it.
- The CI `check` job gains `bun run lint`; the CI work in flight wires it.
- A worktree branched before the reformat rebases, then runs `bun run format` before its diff is
  readable again.

## Out of scope

A pre-commit hook, editor integration, Tailwind class sorting.
