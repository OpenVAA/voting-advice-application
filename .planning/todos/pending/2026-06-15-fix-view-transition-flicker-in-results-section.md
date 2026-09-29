---
created: 2026-06-15T09:50:09.691Z
title: Fix view transition flicker in Results section
area: ui
scope: next-milestone (post-v2.14)
priority: medium
files:
  - apps/frontend/src/routes/[[lang=locale]]/(voters)/(located)/results/
  - apps/frontend/src/lib/components/ (entity-detail drawer / Modal / Drawer)
related:
  - Skill("spike-findings-voting-advice-application-gsd") — spikes 013–016 (View Transitions + a11y: onNavigate→startViewTransition, per-element view-transition-name, reduced-motion)
---

## Problem

Two view-transition / drawer glitches in the voter **Results** section (captured 2026-06-15, targeted for the **next milestone**, post-v2.14):

1. **Scroll position lost after drawer close** — after opening an entity-detail drawer in Results and closing it, the page scroll position is not restored (jumps to top / loses where the user was in the list).
2. **Drawer flicker when changing details tabs** — switching tabs *inside* the entity-detail drawer causes a visible flicker (the drawer content appears to redraw/remount rather than transition smoothly).

Both are user-perceived visual-stability regressions in the same surface, likely tied to the View Transitions + content-node regeneration behaviour explored in spikes 013–016 (the "redraw" symptom is reactive content-node regeneration, addressed via `onNavigate(navigation => Promise(startViewTransition))` + per-element `view-transition-name`, with focus/scroll management on navigate).

## Solution

TBD. Likely directions (to validate during the next milestone):
- Scroll restore: ensure drawer open/close does not trigger a navigation/layout reset that drops scroll; consider preserving/restoring scroll around the drawer toggle (or scoping the drawer so it doesn't remount the results list).
- Tab flicker: give the drawer's tab panels stable `view-transition-name`s and/or `{#key}` only the variant that must remount, so changing tabs transitions instead of remounting; honour reduced-motion.
- Cross-reference the spike-013–016 findings (per-element view-transition-name survival, unified-layout-with-empty-leaf shape) before implementing.
