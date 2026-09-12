---
tags: security, backend
status: accepted
decision-date: 2026-09-12
---

# Writes are guarded by a custom header, Host and Origin, not by a token

## Members

- @sulcer (deciding)
- Claude Code (facilitating)

## Status

`accepted`

## Context and Problem Statement

The server has no login and edits files that decide what Claude Code executes. A web page open in
the same browser can POST a form to `127.0.0.1:8787` without a CORS preflight, and DNS rebinding
can make an attacker's origin resolve to the local machine. Both must be stopped without making
the user log in to a tool running on their own laptop.

## Options considered

- **Random token.** The server prints a token; the page carries it in the URL or a cookie.
  Rejected: a URL token leaks into history and screenshots; a cookie brings CSRF straight back;
  both add friction to a single-user localhost tool; and neither stops DNS rebinding on its own.
- **CORS allowlist.** Rejected: CORS only governs what a browser lets a page *read*. A form POST
  is still sent and still executed.
- **Custom header plus Host plus Origin** (**chosen**). `X-Cluide: 1` forces a preflight the
  server never answers, so browsers refuse cross-origin writes. `Host` must be
  `127.0.0.1:<port>` or `localhost:<port>`, which defeats rebinding. `Origin`, when present,
  must match. The server binds `127.0.0.1` only.

## Decision

`server/security.ts` applies the three checks to every non-`GET` request before any resource
runs: `403` on failure, nothing written, no CORS headers ever. Spec:
[`docs/spec/foundation/security.md`](../spec/foundation/security.md).

## Consequences

- Zero user-facing cost: the page adds one header.
- Not defended, and documented as such: another OS user on the same machine, a malicious browser
  extension.
- Development works only because Vite proxies with `changeOrigin`; see
  [`2026-09-12-vite-builds-the-page.md`](./2026-09-12-vite-builds-the-page.md).
- If cluide ever listens beyond localhost, this ADR must be superseded by real authentication.
