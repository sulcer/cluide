---
tags: ci, release, npm
status: accepted
decision-date: 2026-09-13
---

# Adopt commit-driven releases

## Members

- @sulcer (deciding)
- Claude Code (facilitating)

## Status

accepted

## Context and Problem Statement

cluide has no continuous integration and no release path. Every commit already follows
Conventional Commits, enforced by a hook, and pull requests merge with a merge commit so per-task
history survives. The tool is meant to be started with `bunx cluide`, so a release means an npm
package, and the repository is private today but will be public. The question is which of the
established release shapes fits a repository whose commit messages already say what each change is.

## Options considered

1. **Labels and a drafted release.** Every pull request carries `major`, `minor` or `patch`; a
   drafter keeps a draft release whose version comes from the labels; a human publishes the draft,
   and the publish workflow reads the version from the tag and never commits it. Human-gated and
   simple, but the version intent lives a second time in a label that can disagree with the commit
   type, and a checkout never knows its own version.
2. **Tag, then publish.** A version bump commit lands on `main`, a `v*` tag is pushed by hand, and
   the tag runs the gates and publishes. Simple, but the bump commit bypasses review, and the tag
   is a manual step that is easy to get wrong.
3. **A release pull request cut from the commits.** A bot reads the Conventional Commits since
   the last release, keeps one pull request open with the bumped `package.json` and the changelog,
   and cuts the tag and the GitHub Release when that pull request merges; the publish job runs on
   that event.

## Decision

Option 3, with release-please. The commit type is the one source of version intent, the release is
a pull request the maintainer reads and merges, and the version in a checkout is real. Notes come
from pull request titles, not commits, because merge commits keep every task commit and a
commit-based changelog would list a pull request's title next to its own commits. Publishing uses
npm's trusted publishing over OIDC with provenance, so no token exists to leak or rotate; until the
repository is public, a repository variable keeps the npm step off and releases exist on GitHub
only. Every action is pinned to a commit SHA, every job runs with the least permissions it needs,
and the lockfile is frozen in CI.

## Consequences

- The bot commits `chore: release X.Y.Z` on its own branch; no version bump is ever written by hand.
- The bot's pull request gets no CI run, since GitHub does not start workflows for the Actions
  token's own events. The publish job reruns typecheck, unit and e2e on the tagged commit, which is
  the gate that matters. Required checks on `main` (available once public) will need an
  administrator merge for that one pull request or a token that starts workflows; deferred to
  [`nice-to-have.md`](../nice-to-have.md).
- The runtime dependency list shrinks to `ajv`; the page's packages become dev dependencies
  because `dist/` ships built. `security.md` says so.
- The forbidden-names check reads its list from a repository variable, so the names stay out of
  the tree while CI still enforces the rule.
- The first published version is `0.1.0`; the first publish may need one manual `npm publish`
  because npm attaches a trusted publisher to an existing package.

## Out of scope

Single binaries per platform and a Homebrew formula; they attach to the same publish job later.
