---
tags: frontend, build, tooling
status: accepted
decision-date: 2026-09-12
---

# Vite builds the page, Bun serves it

## Members

- @sulcer (deciding)
- Claude Code (facilitating)

## Status

`accepted`

## Context and Problem Statement

The page is React with shadcn/ui and Tailwind v4. Two bundlers build that with no extra
configuration: Bun's own HTML imports (`import index from "./index.html"` inside `Bun.serve`,
which bundles TSX and CSS and hot-reloads) and Vite. The first proposal was Bun's, for a zero
build step and a single process. The question is whether that saving is worth leaving the path
every tool and example assumes.

## Options considered

- **Bun HTML imports.** One process, no build config, `bun --hot`. Rejected: the shadcn CLI does
  not detect it, so `init` needs a hand-written `components.json`; Tailwind needs a Bun-specific
  plugin; examples and issues on the internet assume Vite. It works, but every step is the
  less-trodden path, and this project is meant to grow.
- **Vite** (**chosen**). Two processes in development, one in production. The shadcn CLI detects
  it, Tailwind v4 is `@tailwindcss/vite`, the IDE understands it.

## Decision

Vite builds `src/` into `dist/`. In development Vite serves the page on 5173 and proxies `/api`
to the Bun server on 8787 with `changeOrigin: true`. In production Bun serves `dist/` and `/api`
from one origin. Spec: [`docs/spec/foundation/dev-and-build.md`](../spec/foundation/dev-and-build.md).

## Consequences

- One more dev dependency and a two-process dev loop, in exchange for the mainstream toolchain.
- The `Host` check in [`security.md`](../spec/foundation/security.md) passes in development only
  because of `changeOrigin`. That one line is load-bearing.
- Single-binary distribution later bundles `dist/` into the Bun executable; nothing here blocks it.
