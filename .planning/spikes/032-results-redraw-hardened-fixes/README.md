---
spike: 032
idea: results-redraw
name: results-redraw-hardened-fixes
type: standard
validates: "Given the three spike-031 fixes in final (non-toggle) form, when the four interactions run, then there are 0 results-subtree remounts, scroll is preserved, the drawer is never painted under the page, and a unit test fails if the load starts tracking the URL again"
verdict: VALIDATED
related: [031, 015, 016]
tags: [sveltekit, load-invalidation, view-transitions, dialog, top-layer, scroll, regression-test]
---

# Spike 032: results-redraw-hardened-fixes

> **This spike's hardened fixes live on the unmerged branch `spike/results-redraw`, behind the redraw-lab panel, and are re-applied to production by hand rather than merged (D-01).** Anything in this README that refers to the lab toggles refers to that branch; it does not run against the shipped tree. The branch is kept unmerged on purpose as Phase 165's reproduction rig (D-02) — the only way to flip back to the broken behaviour side by side. See `.planning/phases/165-results-navigation-redraw/165-NEGATIVE-CONTROL.md` § 5.

## What This Validates

Given the 031 fixes written as production code (lab toggles only *restore* the old behaviour), when switching entity
tabs / opening an entity / switching drawer tabs / closing it, then: 0 remounts, scroll kept, no named VT group ever
painted over an open drawer — and the load-rerun regression is caught by a unit test.

## How to Run

```bash
cd ../voting-advice-application-spike/apps/frontend && npx vite dev --port 5180 --strictPort
# http://localhost:5180/results — defaults are the fixes; panel: loader=current + VT=legacy brings the old behaviour back
npx vitest run "src/routes/(voters)/(located)/layout.tracking.test.ts"
node ../../.planning/spikes/031-results-nav-flicker-forensics/forensics.mjs http://localhost:5180 legacy,hardened
```

## The fixes (final form)

| Fix | Where | Shape |
|-----|-------|-------|
| A. Load doesn't depend on the path | `(located)/+layout.ts` | `pathname` / `search` (only used for the `next=` redirect target) read inside `untrack`, like the params already were |
| A'. Regression test | `(located)/layout.tracking.test.ts` | drives `load` with a Proxy `url` that records every read made outside the provided `untrack`; asserts none, on 4 results/questions URLs. A control case flips the lab to the old read and asserts `pathname` is caught |
| B. No document VT for overlay navigations | `viewTransition.ts#isOverlayNavigation` + root `onNavigate` | from/to params carry `entity` + `id` → skip; the dialog's own backdrop fade / fly-in is the motion |
| C. Never VT with names while a modal is open | `viewTransition.ts#startViewTransition` + `html.vt-no-names *` rule in root layout | covers the drawer's local-tab VT (not a navigation, so B can't catch it) |
| D. Tab switches keep scroll | results `+layout.svelte` `handleEntityTabChange` | `goto(…, { noScroll: true })` |

## Investigation Trail

1. Rewrote `viewTransition.ts` so the rules live in production code; the lab only overrides (`vt: legacy | off`).
   Dropped the `names` toggle — C is unconditional when a modal is open (the invariant from 031).
2. Loader fix no longer gated on `typeof window` — the untracked read is correct on the server too.
3. `layout.tracking.test.ts` (new; `layout.load.test.ts` already exists for the empty-selection guard). 5/5 pass;
   the control case confirms the Proxy catches the pre-032 `pathname` read.
4. Headless `legacy` vs `hardened` (slowmo 2 s, scrollY 700): legacy 4 remounts, scroll 700→0 on open & close, 5 VTs
   with `persistent-header`/`main-content` named; hardened 0 remounts, scroll 700→700, open/close `vt skipped`,
   drawer-tab VT `stripNames=true named=[]`. Screenshots: drawer fully in front during the drawer-tab cross-fade.
5. **False alarm:** at scrollY 0 hardened "scrolled to 566" on open — Playwright scrolls an off-screen card into view
   before clicking (log: `scrollY 0 → 566` *before* the `nav` line). The app then keeps it; legacy threw it back to 0.
6. `svelte-check`: 0 errors / 2174 files.

## Results

**Verdict: VALIDATED.** All four symptoms fixed with ~30 lines of production change + one test, no route restructure:

| # | Symptom | legacy | hardened |
|---|---------|--------|----------|
| 1 | Intro fades on entity-tab switch | subtree remount | intro static; only the list cross-fades inside `main-content` |
| 2 | Scroll-to-top + header flash on open | 700→0; header group over backdrop | 700→700; no VT, backdrop + drawer from frame 1 |
| 3 | Flicker on close | remount + page cross-fade | no VT; backdrop fades, list untouched (0 list DOM churn) |
| 4 | Page in front during drawer-tab switch | `main-content` above dialog | names stripped; drawer stays in front |

**Open nits (for the real build, not blocking):**
- The drawer has no *out* animation: `ModalContainer.handleClose` calls `dialog.close()` synchronously, then the `{#if}`
  removes it (local `transition:fly` doesn't play on parent-block removal). Close is instant. 034's host could fix it.
- The drawer-tab switch is a whole-viewport root cross-fade (dialog included). Acceptable; an element-scoped VT or a
  plain CSS fade on the tab panel would be tighter.
- `isOverlayNavigation` keys on `entity` + `id` params — fine while the results drawer is the only routed overlay.
