---
tags: backend, safety, files
status: accepted
decision-date: 2026-09-12
---

# One write primitive: slice etag, backup, atomic rename, git diff

## Members

- @sulcer (deciding)
- Claude Code (facilitating)

## Status

`accepted`

## Context and Problem Statement

cluide writes files that Claude Code reads at any moment and that the user also edits by hand.
Four things can go wrong: a half-written file, a silent overwrite of a change made elsewhere, an
edit with no way back, and an edit the user cannot see. Five resources write. If each solved
these on its own they would solve them differently, and one of them would get it wrong.

## Options considered

**Conflict detection**

- *Modification time.* Rejected: unreliable across editors and file systems, second resolution on
  some.
- *Hash of the whole file.* Rejected for typed resources: `~/.claude.json` is rewritten by Claude
  Code constantly, so every save would return `409` for a change the user never touched.
- *Hash of the managed slice* (**chosen**): SHA-256 of the file for text; of the JSON slice a
  typed resource owns for the rest.

**Backups**

- *Inside `~/.claude/backups/`.* Rejected: that directory belongs to Claude Code.
- *`~/.cluide/backups/<encoded path>/<timestamp>`, last 50 per file* (**chosen**).

**Diff**

- *A diff library.* Rejected: a dependency for something `git` already does on every dev box.
- *`git diff --no-index` via `Bun.spawn`* (**chosen**). Exit code 1 means "differences".

**Structure**

- *Each resource writes its own files.* Rejected, for the reason in the problem statement.
- *One `writeText(path, content, expectedEtag?)` every resource calls* (**chosen**).

## Decision

`server/fs.ts` exports `writeText`. In order: allowlist via `realpath`, etag check, backup,
write to a temp file in the same directory then `rename`, diff. A backup failure aborts the
write. Spec: [`docs/spec/foundation/write-safety.md`](../spec/foundation/write-safety.md).

## Consequences

- Every write is reversible and visible.
- A Claude Code write to an unrelated key never blocks a save; a real conflict on the same slice
  still does.
- Known ceiling: the window between read and rename on `~/.claude.json`. Recorded in
  [`docs/nice-to-have.md`](../nice-to-have.md).
- `git` must be on `PATH`. If it is not, the diff is empty and the write still succeeds.
