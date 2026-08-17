---
created: 2026-06-06T15:33:06.074Z
title: Disable hover and pointer on disabled Results header button
area: ui
priority: high
files:
  - apps/frontend/src/routes/Banner.svelte:76-84
  - apps/frontend/src/lib/components/button/Button.svelte
---

## Problem

The **Results** button in the app header (`Banner.svelte:77-83`, a
`<Button variant="responsive-icon" icon="results">` with
`disabled={voterCtx == null ? true : !voterCtx.resultsAvailable}` and
`href={getRoute.current('Results')}`, testid `voter-banner-results`) still shows a
**hover effect and a `cursor: pointer`** while it is disabled (results not yet
available — not enough opinion answers).

A disabled control must not invite interaction: no hover state, no pointer cursor
(should be `cursor: not-allowed` or default). Because the button has an `href`, it
likely renders as an `<a>` and the disabled styling path doesn't suppress the
anchor's hover/cursor the way a disabled `<button>` would.

High priority — it's a visible affordance bug in the primary nav.

## Solution

TBD. Likely fix in `Button.svelte`'s disabled-state styling rather than at the call
site, so it applies wherever a disabled href-Button is used:
- When `disabled` is true, suppress hover utilities and set
  `cursor-not-allowed` (and ensure `pointer-events` / `aria-disabled` are handled so
  the anchor isn't navigable).
- Verify the `variant="responsive-icon"` + `href` path specifically (anchor render),
  not just the plain `<button>` render.
- Confirm the existing results-link gating logic (`resultsAvailable`) is unchanged —
  this is purely the disabled *visual/affordance* state.
