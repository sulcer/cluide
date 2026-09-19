---
tags: ui, tokens
status: accepted
decision-date: 2026-09-19
---

# Theme the scrollbars

## Members

- @sulcer (deciding)
- Claude Code (facilitating)

## Status

accepted

## Context and Problem Statement

The page never set `color-scheme`, so the browser painted its light native scrollbar over the dark
theme. Scrolling a file list, a table or the editor flashed a pale bar that belongs to no part of
the palette, and the page has several scroll areas side by side, so more than one could show at
once.

## Options considered

1. **Set `color-scheme` only.** One line per theme. The scrollbar follows the theme and stays an
   overlay that fades out, so it takes no layout width. It is still the platform's scrollbar, which
   differs between macOS, Windows and Linux, and on a mouse it is a wide classic bar.
2. **Style the scrollbar as well.** `::-webkit-scrollbar` gives every scroll area the same thin
   thumb in the palette's own colours, whether the platform overlays its bars or reserves room for
   them.

## Decision

Both. `color-scheme` follows the theme, so native controls and any unstyled scrollbar match, and
`::-webkit-scrollbar` gives the scroll areas one thin themed bar: 10px, a `--input` thumb with a
4px transparent inset border and a `--muted-foreground` thumb on hover, no track and no buttons.
The point is that every pane's bar looks the same and belongs to the palette. A bar that appears
over content as a wheel moves is fine; a pale one that belongs to the browser is not.

## Consequences

- `tokens.md` carries the values with a `Changes:` backlink here; every scroll area inherits them,
  since the rules sit on `*` in the base layer.
- Where the platform reserves room for a scrollbar, a scrollable pane is 10px narrower in content
  than before; on macOS, whose bars overlay, nothing reflows. Measured in Chrome on macOS after the
  change, a scrolling pane's `offsetWidth` still equals its `clientWidth`.
- The command menu keeps its `no-scrollbar` treatment: it is a floating layer where a bar would
  read as chrome.

## Out of scope

`scrollbar-gutter: stable`, which would reserve the width on every platform, whether or not a pane
scrolls. Worth revisiting if a list is seen shifting as content grows past the fold.
