---
created: 2026-08-26T19:30:00.000Z
title: 15 font-medium / font-semibold classes emit no utility at all
area: ui / type scale
severity: minor
source: Phase 146 (D-09, measured and deferred)
files:
  - apps/frontend/src/app.css
---

## Problem

Nine `font-medium` and six `font-semibold` usages across `apps/frontend/src` emit **nothing**.
`apps/frontend/src/app.css:93` sets `--font-weight-*: initial` and then re-declares only
`normal: 400` and `bold: 700`, so the two intermediate weights have no corresponding utility
to generate. The classes are dead weight in the literal sense: they are in the markup, they
look intentional, and they change no pixel.

Measured during Phase 146 while auditing what the self-hosted Inter subset needs to carry.
The vendored set is 400 and 700 only, which is consistent with the theme as it stands — so
this is not currently a rendering bug. It is a latent trap: anyone adding
`--font-weight-medium: 500` to the theme would silently change 9 sites at once.

## Solution

Pick one, deliberately:

1. **Collapse to the real scale** — rewrite the 15 usages as `font-normal` / `font-bold`,
   matching what the theme actually offers. Nothing renders differently; the markup stops
   lying.
2. **Grow the scale** — declare `--font-weight-medium` / `--font-weight-semibold` in
   `app.css` *and* vendor the matching woff2 weights into `apps/frontend/static/fonts/`
   (plus the `@font-face` rules in `inter.css`). This changes rendering at 15 sites and
   grows the font payload; it needs a design decision, not a mechanical edit.

## Why it was not folded into Phase 146

It is a type-scale **design** decision, not test infrastructure, and Phase 146 was a visual-gate
phase. D-09 deferred it explicitly after measuring it.
