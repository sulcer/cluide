---
tags: frontend, spec, keyboard
status: accepted
decision-date: 2026-09-13
---

# Keyboard and cursor after hands-on testing

## Members

- @sulcer (deciding)
- Claude Code (facilitating)

## Status

accepted

## Context and Problem Statement

The first hands-on run of the built page in Chrome on macOS found two things the render suite could
not: `⌘⇧T`, the theme chord in the `ui` spec, reopens Chrome's last closed tab instead of toggling
the theme, because Chrome acts on that chord before the page sees the key event (Playwright's
`keyboard.press` dispatches below that layer, so the suite was green). And no clickable control
showed the pointer cursor: Tailwind v4's preflight leaves buttons at `cursor: default`, and shadcn's
`init`, which offers a base rule for it, was never run in this repo.

## Options considered

1. **Another `⌘⇧` letter for the theme.** Every such letter is bound by some browser (`⌘⇧N`,
   `⌘⇧D`, `⌘⇧J`, `⌘⇧B`, `⌘⇧A`, `⌘⇧R` in Chrome alone), so the choice is a gamble per browser.
2. **A plain key outside inputs, like `j` and `k`.** Works everywhere, but a theme toggle is rare
   enough that a hidden single-key binding is a surprise, not a convenience.
3. **No chord.** The footer button and the command menu's `Toggle theme` action stay.

For the cursor: a per-component class on every clickable element, or one base rule.

## Decision

No theme chord (option 3); `⌘1` to `⌘9`, `⌘K`, `⌘S`, `Esc`, `j` and `k` stay, since the page
receives all of them before Chrome acts. One base rule in `globals.css` gives every enabled
`button`, `[role="button"]`, `[role="option"]`, `[role="switch"]`, `a[href]` and `label[for]` the
pointer cursor, so a new control gets it without remembering a class.

## Consequences

- `ui/README.md` Keyboard, `shell.md` Command menu and `tokens.md` Controls changed with backlinks
  here; `useShortcuts.ts` and the command-menu item lost the chord; the shortcuts render case now
  proves the page ignores `⌘⇧T` and flips the theme from the menu and the footer instead.
- A render case asserts the computed cursor on a list item, a sidebar link, the theme button and a
  command-menu option, so the base rule cannot regress silently.
- The two command lists no longer force `cursor-default` on their items.
