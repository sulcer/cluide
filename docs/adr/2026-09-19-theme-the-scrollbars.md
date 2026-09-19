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
   thumb in the palette's own colours. The cost is that a styled scrollbar is never an overlay: it
   takes 10px of width whenever a pane can scroll, on every platform.

## Decision

Both. `color-scheme` follows the theme, so native controls and any unstyled scrollbar match, and
`::-webkit-scrollbar` gives the scroll areas one thin themed bar: 10px, a `--input` thumb with a
4px transparent inset border and a `--muted-foreground` thumb on hover, no track and no buttons.
The width is constant, which is the point: a pane that can scroll always looks the same, rather
than a bar appearing over content the moment a wheel moves.

## Consequences

- `tokens.md` carries the values with a `Changes:` backlink here; every scroll area inherits them,
  since the rules sit on `*` in the base layer.
- A scrollable pane is 10px narrower in content than before. The lists and tables already ellipsis
  their long values, so nothing reflows badly.
- The command menu keeps its `no-scrollbar` treatment: it is a floating layer where a bar would
  read as chrome.

## Out of scope

`scrollbar-gutter: stable`, which would reserve the width even when a pane does not scroll. Worth
revisiting if a list is seen shifting as content grows past the fold.
