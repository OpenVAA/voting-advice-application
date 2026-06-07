---
phase: 101-suite-re-enable-milestone-close-green-gate
plan: 02
subsystem: testing
tags: [accessibility, axe, wcag, playwright, svelte5, runes, color-contrast]

requires:
  - phase: 95-100
    provides: Svelte 5 runes migration (which introduced the EntityList locale rune-handle regression fixed here)
  - phase: 99
    provides: 99-UAT carried-in color-contrast gap (resolved here as a false positive)
provides:
  - a11y-smoke voter-detail-drawer scan now waits for the drawer entrance transition (no mid-fly false positives)
  - EntityList results render fixed (locale rune-handle crash)
affects: [101-03]

tech-stack:
  added: []
  patterns:
    - "Before an axe scan on a transitioned overlay, await el.getAnimations({subtree:true}) finished so axe doesn't composite text through in-flight opacity"

key-files:
  created: []
  modified:
    - tests/tests/specs/a11y/a11y-smoke.spec.ts
    - apps/frontend/src/lib/dynamic-components/entityList/EntityListWithControls.svelte
    - apps/frontend/src/lib/dynamic-components/entityList/EntityListControls.svelte

key-decisions:
  - "The carried-in 99-UAT color-contrast 'gap' was a SCAN-TIMING FALSE POSITIVE, not a real theme defect. axe scanned the voter-detail-drawer mid fly-in (Svelte transition:fly animates opacity 0->1), compositing text through ~0.69 opacity: #666666->#969696 (2.95:1), #2546a8->#6a80c3 (3.82:1). At full opacity the tokens pass (≈5.7:1 / ≈8.6:1). FIX = wait for the transition; NO app.css / staticSettings / theme change."
  - "Plan Task 3's app-shared rebuild step is moot — no theme token changed."

patterns-established:
  - "Theme colors are authored in apps/frontend/src/app.css (@plugin 'daisyui/theme'), kept in sync with packages/app-shared staticSettings.ts — app.css is what renders text-secondary/primary"

requirements-completed: [SUITE-01]

duration: ~2h (incl. deep RCA: stale-HMR ruled out, EntityList crash, false-positive RCA, operator E2E verification)
completed: 2026-06-06
---

# Phase 101 Plan 02: a11y color-contrast (voter-detail-drawer) Summary

**Resolved the carried-in voter-detail-drawer color-contrast failure as a scan-timing false positive — axe was scanning mid drawer fly-in; the fix is a transition-settle wait, with NO theme change — and fixed an EntityList rune-migration crash that blocked the results render entirely.**

## Performance
- **Duration:** ~2 h (RCA-heavy)
- **Completed:** 2026-06-06T15:49:50Z
- **Tasks:** 3/3 (Task 1 evidence; Task 2 fix; Task 3 operator-verified 8/8)

## Accomplishments
- **Task 1 (axe evidence):** captured the violating nodes — `text-secondary` muted labels (`match`, `.small-info` category labels, `.small-label`/`.test-label` Election/Constituency/List) at `#969696` (2.95:1), and bold party/alliance names (`primary`) at `#6a80c3` (3.82:1), all against `#ffffff`.
- **RCA:** rendered colors were *exactly* the tokens at ~0.69 opacity. No `opacity`/`color-mix`/color-opacity modifier exists in app.css or the entity components — the multiplier was the **drawer fly-in transition** (`Drawer.svelte:82 transition:fly`, opacity 0→1) captured by axe mid-animation. Operator confirmed the contrast renders fine in a real browser.
- **Task 2 (fix):** a11y-smoke now awaits the dialog subtree's animations to finish before AxeBuilder runs. No color/theme change.
- **Task 3:** operator-verified `PLAYWRIGHT_A11Y=1 ... --project=a11y-smoke` → **8/8 green, 0 color-contrast.**
- **D-02 (prerequisite):** fixed an EntityList crash that prevented the results list from rendering at all.

## Task Commits
1. **Task 1 (evidence):** captured in this SUMMARY (no code commit — read-only axe capture)
2. **Task 2 (fix): await drawer fly transition before axe scan** — `867471f4c` (fix)
3. **Task 3 (verify 8/8):** operator-verified checkpoint

## Deviations / D-02 fixes
- **`fix(101): unbreak EntityList — read locale rune handle via .current`** — `ccf40c8e5`. The voter results list crashed with `store.subscribe is not a function` on election selection: `EntityListWithControls.svelte` still bridged `locale` via `fromStore(locale)`, but the Phase 97/98 store→rune migration made `locale` a `{ readonly current }` handle and removed the store shape. The throw aborted the `{#if activeElectionId}` render, so the page looked stuck on "select election first" even though the URL updated. Also fixed a latent type error in sibling `EntityListControls.svelte` (passed the handle, not `.current`, to TextPropertyFilter). Both files were missed by the migration codemod.

## Key correction to the plan
- The plan named `staticSettings.ts` as the theme source; the *rendered* DaisyUI theme is hardcoded in **`apps/frontend/src/app.css`** (`@plugin 'daisyui/theme'`, light+dark), kept in sync with staticSettings. No change was needed in either, but future contrast work edits app.css.

## Self-Check: PASSED
- a11y-smoke 8/8 green, 0 color-contrast (operator-verified). a11y gate code unchanged (no weakening). No theme token changed.
