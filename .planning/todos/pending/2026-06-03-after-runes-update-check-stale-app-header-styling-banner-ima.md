---
created: 2026-06-03T19:12:34.010Z
title: After runes update, recheck app header styling, banner images, and post-login candidate nav
area: ui
files:
  - apps/frontend/src/lib/components/
resolves_phase: 124
---

## Problem

The Svelte 5 runes migration (see the `spike-findings-voting-advice-application-gsd` skill — reactive context shapes, destructure-trap, layout-as-state restructure, View Transitions) is expected to touch the app's reactive rendering in ways that may leave a few visual/navigation surfaces stale or subtly broken. Three areas to re-verify **after** the runes migration lands:

1. **App header styling** — confirm header styles are not stale/regressed after the reactive context rewrite (header consumes appSettings/locale/darkMode-style stores that change shape under runes).
2. **Banner images** — confirm banner/hero images still load and render correctly (asset/derived-state paths can break when reactive accessors are migrated).
3. **Candidate navigation after login** — confirm the candidate app's navigation renders correctly once authenticated (the candidateContext destructure-trap was the original Phase 61 diagnosis; post-login nav is the highest-risk surface for a reactivity regression).

This is a **trigger-conditioned** follow-up: it only becomes actionable once the runes migration is in progress/complete. (Captured as a todo per request; consider promoting to a `--seed` with trigger "runes migration merged" if it should auto-surface then.)

## Solution

TBD — verification pass, not a fixed change. After the runes migration:
- Visually diff the app header (light/dark, both apps) against pre-migration; check for stale Tailwind/DaisyUI classes or lost reactive style bindings.
- Verify banner/hero images render across routes and locales.
- Log in as a candidate and walk the post-login navigation (protected routes, nav menu, logout) for missing/incorrect nav state.
- File concrete fix todos for anything broken; pairs naturally with the navigation-menu test todo (`add-navigation-menu-tests-both-apps-settings-permutations`).
