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

---

## Closed with a named residue — 2026-09-23 (Phase 165, plan 165-08)

**Not "done".** This todo carried two symptoms. One is closed outright by Phase 165; the other is
not, and is closed here only in the sense that it is handed to a named, recorded successor. Marking
the file done without saying which is which would misrepresent what shipped.

### Symptom 1 — scroll position lost after drawer close: **CLOSED**

This is ROADMAP Phase 165 success criterion 2 verbatim, and it is registered as
**`RNAV-02`** in `.planning/REQUIREMENTS.md` § _Results Navigation (Phase 165)_.

The cause was not the drawer at all. `routes/(voters)/(located)/+layout.ts` read `url.pathname` and
`url.search` **tracked** for its `next=` redirect target, outside its own `untrack`. One tracked read
reruns the whole load on every results navigation — drawer open and close included — which
re-streamed the question and nomination data, flipped `(located)/+layout.svelte`'s `ready` flag to
`false`, replaced the subtree with `<Loading/>` and remounted everything, clamping scroll to 0. The
fix moves those two reads inside `untrack`; `{ noScroll: true }` on the entity-tab branch covers the
remaining case.

**Evidence, not assertion.** The behaviour is pinned by a committed spec in the default E2E suite —
`tests/tests/specs/voter/voter-results-redraw.spec.ts`, Playwright project `voter-results-redraw` —
which measures the offset across open, close and tab switch **from a scrolled start** that is itself
hard-asserted, so the equality cannot pass vacuously. The load-rerun cause is guarded separately and
permanently by `apps/frontend/src/routes/(voters)/(located)/layout.tracking.test.ts`. Both were
observed failing against injected regressions:
`.planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md` § 12 (NC-6 — dropping
`noScroll` takes the offset from 171 to 0) and § 7 (NC-1 — restoring the tracked read reds the
loader guard).

### Symptom 2 — drawer flicker when changing details tabs: **NOT CLOSED — this is the residue**

Phase 165 did **not** fix this. What it did was remove the worst of it: a document View Transition
running with `view-transition-name`s while the drawer is open used to paint the results page *in
front of* the drawer during a tab switch (spike 031). Names are now stripped for any transition that
runs while a modal `<dialog>` is open, so the drawer is no longer covered.

**What remains is the transition itself.** An in-drawer tab switch still animates as a
**whole-viewport root cross-fade**, because stripping the names is exactly what collapses the page
into one `root` image. The residue is spike 032's open nit, and it is cosmetic:

> **Element-scoped View Transition (or a plain CSS fade) on the drawer's tab panel**, instead of
> today's whole-viewport root cross-fade.

**Where it is recorded**, so it does not die with this file:
`.planning/phases/165-results-navigation-redraw/165-CONTEXT.md` § _Deferred Ideas_, first item — which
names this todo as what it is the residue half of — and
`165-NEGATIVE-CONTROL.md` § _Residue accepted by this phase_.

### On this file's own cross-reference

The `related:` pointer to spikes 013–016 **remains accurate** — the View-Transitions wiring, the
per-element `view-transition-name` survival finding and the reduced-motion belt-and-braces are all
still the mechanism in play. It is **superseded in detail** by spikes 031–034 and by the
`results-redraw` domain those produced in that same skill, which is where the results-specific
invariants now live: a document View Transition must never run with names while a modal is open, and
the `(located)` load must not read the URL tracked.
