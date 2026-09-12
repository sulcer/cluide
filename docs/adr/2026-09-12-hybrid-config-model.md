---
tags: api, backend, design
status: accepted
decision-date: 2026-09-12
---

# Hybrid config model: one generic file resource, typed resources only where files merge

## Members

- @sulcer (deciding)
- Claude Code (facilitating)

## Status

`accepted`

## Context and Problem Statement

Claude Code's setup is two kinds of thing. Most of it is plain text at a known path: memory
files, rules, agents, skills, commands, hook scripts, keybindings. Three things are views over
several files: settings (two files per scope plus a schema), MCP servers (five sources with a
precedence order and a separate approval file), and plugins (two registries plus one key in
settings). The server has to model both, and the choice decides where merging logic lives and
how much backend each new screen costs.

## Options considered

- **Files-first.** One `GET`/`PUT /api/file?path` over an allowlist; the browser parses
  everything. Smallest backend. Rejected: the MCP merge and the plugin join become client code,
  every screen re-implements "which file does this live in", and the allowlist is the only thing
  between a typo and a write anywhere.
- **Resources-first.** One typed endpoint per screen, each backed by a module that knows its
  files. Clean contracts. Rejected: overkill for the seven text kinds, which differ only by
  directory, and every new text kind would need a new module.
- **Hybrid** (**chosen**). A generic files resource keyed by `kind` for text; typed resources for
  settings, MCP and plugins. Both route through one write primitive.

## Decision

Adopt the hybrid. `server/resources/files.ts` handles memory, rules, agents, skills, commands,
hooks and keybindings; `kind` only decides which directory to list. `settings.ts`, `mcp.ts` and
`plugins.ts` are typed because their view spans files. Adding a text kind is a table row; adding
a merged view is a module. Every resource takes `scope` from day one, because settings and MCP
exist at user and project level. Spec: [`docs/spec/api/README.md`](../spec/api/README.md).

## Consequences

- Merging logic lives in one place per concern, on the server, and is unit tested there.
- The client never knows file paths for typed resources; it knows a scope and a target.
- A future merged view (health, activity) is a new typed module and does not touch `files.ts`.
