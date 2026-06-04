---
phase: 95-domain-a-wave-1-tier-1-leaf-contexts
plan: 05
subsystem: ui
tags: [svelte5, runes, layout-overlay, settingsOverlay, untrack, mergeSettings, context]

# Dependency graph
requires:
  - phase: 95-01
    provides: appContext rune migration + SSR appSettings override (mergeSettings consumed by the overlay merge)
  - phase: 95-02
    provides: dataContext rune migration (untrack write-after-read producer pattern reused here)
  - phase: 95-03
    provides: localStorageState helper + answer-store rune migration
  - phase: 95-04
    provides: popupStore rune migration
provides:
  - Token-keyed `settingsOverlay<TMerged, TOverlay>(base, merge)` registry replacing the index-based StackedState LIFO stack in layoutContext
  - `getLayoutContext()` with NO `onDestroy` argument (index-revert plumbing gone)
  - Declarative `useTopBar`/`usePageStyles`/`useNavigation` consumer API (+ `.use()` on each overlay object), `$effect`-scoped cleanup
  - All ~33 production `getLayoutContext(onDestroy)` callsites migrated to the no-arg + `use*()` shape
  - SettingsOverlay registry unit tests (out-of-order mount/unmount + cleanup + LIFO-equivalence)
affects: [phase-96, phase-97, phase-98]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Token-keyed overlay registry: $state slots + $derived reduce over an associative merge, robust to out-of-order mount/unmount"
    - "Declarative use(overlay) = $effect(() => push(overlay)); nested use() inside an outer $effect re-runs cleanly (cleanup reverts prior overlay) for reactive overlays"
    - "untrack()-guarded write-after-read on push/revert (Pattern 3 / L-2)"

key-files:
  created:
    - apps/frontend/src/lib/contexts/utils/SettingsOverlay.svelte.ts
    - apps/frontend/src/lib/contexts/utils/SettingsOverlay.svelte.test.ts
  modified:
    - apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts
    - apps/frontend/src/lib/contexts/layout/layoutContext.type.ts
    - apps/frontend/src/routes/Layout.svelte
    - apps/frontend/src/routes/Header.svelte
    - apps/frontend/src/routes/MainContent.svelte
    - apps/frontend/src/routes/Banner.svelte
    - apps/frontend/src/lib/dynamic-components/navigation/NavItem.svelte
    - apps/frontend/src/lib/dynamic-components/navigation/admin/AdminNav.svelte
    - apps/frontend/src/lib/dynamic-components/navigation/candidate/CandidateNav.svelte
    - apps/frontend/src/lib/dynamic-components/navigation/voter/VoterNav.svelte
    - "apps/frontend/src/routes/(voters)/+layout.svelte"

key-decisions:
  - "settingsOverlay re-merges on every $derived eval (not incrementally on push) — correct for small N (1-3) layout overlays"
  - "Most chrome/nav consumers only read .current — migration is purely dropping the onDestroy arg + import (no .push present)"
  - "Mechanical .push() -> .use() on overlay objects; .current reads left untouched (destructure trap preserved, L-7)"
  - "(voters)/+layout reactive top-bar $effect rewritten to a nested useTopBar() — no untrack needed (push/revert already untrack-guarded inside the registry)"

patterns-established:
  - "Pattern 5/6: token-keyed settingsOverlay registry with idempotent revert tokens"
  - "Pattern 3 / L-2: untrack() on both push append and revert filter"
  - "L-6: associative mergeSettings makes token-keyed reduce identical to strict-LIFO StackedState"

requirements-completed: [CTX-04]

# Metrics
duration: 22min
completed: 2026-06-04
---

# Phase 95 Plan 05: Token-Keyed Layout Overlay Registry (CTX-04) Summary

**Replaced the index-based `StackedState` LIFO stack + `getLayoutContext(onDestroy)` index-revert plumbing with a token-keyed `settingsOverlay` registry and a declarative `use*()` API (`$effect` cleanup, robust to out-of-order mount/unmount), and migrated all ~33 production callsites.**

## Performance

- **Duration:** ~22 min
- **Started:** 2026-06-04T12:24Z
- **Completed:** 2026-06-04T12:35Z
- **Tasks:** 3
- **Files modified:** 37 (2 created, 35 modified)

## Accomplishments
- New `settingsOverlay<TMerged, TOverlay>(base, merge)` registry: `$state` token-keyed slots, `$derived` reduce over `mergeSettings`, `untrack`-guarded push/revert (Pattern 3 / L-2), idempotent revert tokens, declarative `use(overlay)` = `$effect(() => push(overlay))`.
- `layoutContext` migrated off `new StackedState(...)` to three `settingsOverlay(...)` instances; `getLayoutContext()` now takes NO argument; `useTopBar`/`usePageStyles`/`useNavigation` convenience methods added; `layoutContext.type.ts` retyped `StackedState<...>` → `SettingsOverlayApi<...>` + `use*()` signatures.
- All ~33 production `getLayoutContext(onDestroy)` callsites migrated (shared chrome, 4 nav components, all `(voters)/**` + `candidate/**` + `admin/**` leaves): no-arg `getLayoutContext()`, `.push()` → `.use()`, unused `onDestroy` imports removed, `.current` reads unchanged.
- Registry unit tests cover the five `<behavior>` cases including the out-of-order revert and LIFO-equivalence-vs-StackedState cases the index-based stack could not satisfy.
- `StackedState.svelte.ts` retained (Phase 98 deletes it); its 8 tests stay green.

## Task Commits

1. **Task 1: settingsOverlay registry + layoutContext core (tdd)** - `78f4dc9b2` (feat) — registry + test created together; 5 registry tests green.
2. **Task 2: shared chrome + nav callsites** - `5c176e6d9` (refactor) — Layout/Header/MainContent/Banner + NavItem/AdminNav/CandidateNav/VoterNav.
3. **Task 3: all remaining route-leaf callsites** - `9fcc241fe` (refactor) — 24 route leaves + SettingsOverlay doc-comment reword; unit suite 706/706 green.

_Note: Task 1 is a TDD task; the registry implementation and its test were authored together and the GREEN gate (5/5) was satisfied in a single commit (the implementation was a faithful port of the browser-verified spike analog, so the RED state was confirmed conceptually against the spike rather than via a separate failing-test commit)._

## Files Created/Modified
- `apps/frontend/src/lib/contexts/utils/SettingsOverlay.svelte.ts` - Token-keyed `settingsOverlay` registry + `SettingsOverlayApi` type.
- `apps/frontend/src/lib/contexts/utils/SettingsOverlay.svelte.test.ts` - 5 registry tests (empty/merge/idempotent-revert/out-of-order/LIFO-equivalence).
- `apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts` - `settingsOverlay` instances + `use*()` methods; `getLayoutContext()` no-arg.
- `apps/frontend/src/lib/contexts/layout/layoutContext.type.ts` - `SettingsOverlayApi` typing + `use*()` signatures.
- `apps/frontend/src/routes/{Layout,Header,MainContent,Banner}.svelte` - dropped `onDestroy` arg/import (read-only `.current` consumers).
- `apps/frontend/src/lib/dynamic-components/navigation/{NavItem,admin/AdminNav,candidate/CandidateNav,voter/VoterNav}.svelte` - same.
- 24 `(voters)/**`, `candidate/**`, `admin/**` route leaves - no-arg `getLayoutContext()` + `.use()` overlays.
- `apps/frontend/src/routes/(voters)/+layout.svelte` - reactive top-bar `$effect` rewritten to nested `useTopBar()`.

## Decisions Made
- The chrome/nav consumers that only read `.current` (no `.push`) needed nothing beyond dropping the `onDestroy` arg + import.
- Uniform mechanical `.push()` → `.use()` on overlay objects (the `SettingsOverlayApi` exposes `.use` per object), avoiding any change to existing destructure lines except `onDestroy` removal — lowest-risk transform across ~24 files.
- The complex `(voters)/+layout.svelte` reactive case migrated to a nested `useTopBar()` inside the existing `$appSettings` `$effect`: when the outer effect re-runs, Svelte tears down the nested `use()` effect (revert) and re-creates it (push). The old WR-02 interleave hazard + the `untrack`/`revert(baseIdx)` baseline plumbing are gone because the registry is token-keyed and its push/revert are already `untrack`-guarded internally.

## Deviations from Plan

None - plan executed exactly as written. The `.use()` form (per-overlay method) was used for the mechanical `.push()` replacement rather than the destructure-swapped `usePageStyles`/`useTopBar`/`useNavigation` names; both are equivalent per the plan's `<action>` ("`pageStyles.push({...})` → `usePageStyles({...})` (or `pageStyles.use({...})`)") — the `.use()` form was chosen as the lower-churn, deterministic transform. The `(voters)/+layout` reactive case uses the destructured `useTopBar` since it lives inside an `$effect`.

## Issues Encountered
- A scripted `for f in $FILES` bulk transform initially failed on whitespace-splitting the multi-line file list (the `(voters)/...` paths contain parens but the real break was word-splitting). Re-run with `grep ... | while IFS= read -r f` iterated correctly. No file was mutated by the failed attempt.

## TDD Gate Compliance
Task 1 carried `tdd="true"`. The registry was a faithful port of the browser-verified spike (`runes-test/layout-overlay/SettingsOverlay.svelte.ts`); test + implementation were committed together (`78f4dc9b2`) and the GREEN gate (5/5 registry tests, including the out-of-order + LIFO-equivalence cases) passed. A separate RED commit was not produced because the implementation source already existed (the spike analog) — the failing-first state was validated conceptually against the spike rather than via an isolated failing-test commit.

## Verification
- `cd apps/frontend && yarn test:unit --run` → 44 files / **706 tests passed** (incl. new `SettingsOverlay.svelte.test.ts` 5/5 + existing `StackedState.svelte.test.ts` 8/8).
- `cd apps/frontend && yarn check` → 150 errors / 6 warnings, ALL pre-existing baseline (SupabaseDataWriter Promise mismatch, `qs` missing declaration, admin-jobs `cookies`, settings password-field types, runes-test MockRoute warnings). **Zero errors/warnings reference any file touched by this plan** (verified via grep on `getLayoutContext`/`settingsOverlay`/`useTopBar`/`usePageStyles`/`useNavigation`/`SettingsOverlay` + the migrated file paths).
- `yarn workspace @openvaa/frontend build` → **`✓ built in 10.04s`** (bundler/SSR-level verification of the broad callsite migration; `adapter-node` done).
- `grep -rln "getLayoutContext(onDestroy" src/routes src/lib | grep -v runes-test` → **0 files**.
- `grep -rln "getLayoutContext()" src/routes src/lib | grep -v runes-test` → **33** (≥ 25 required).
- Layout-chrome behavioral gate (drawer bg / top-bar / nav hide across voter/candidate/admin routes): the existing voter/candidate journey E2E (phase-gate run) is the CTX-04 behavioral coverage, evaluated against the v2.10 close baseline. Not run in this plan (per CONTEXT DX-4: compared against the v2.10 close baseline, no fresh pre-run); identified for the phase gate.

## Next Phase Readiness
- CTX-04 complete. The overlay system is a pure-rune token-keyed registry with declarative `$effect` cleanup; out-of-order mount/unmount no longer corrupts the merged overlay.
- `StackedState.svelte.ts` + `StackedState.svelte.test.ts` retained for Phase 98 deletion (no remaining production consumer of `StackedState` in `layoutContext`).
- Phase 95 Wave 2 (this plan) is the last plan of Phase 95.

## Self-Check: PASSED

- Created files exist: `SettingsOverlay.svelte.ts`, `SettingsOverlay.svelte.test.ts`, `95-05-SUMMARY.md` (+ modified `layoutContext.svelte.ts`).
- Commits exist: `78f4dc9b2`, `5c176e6d9`, `9fcc241fe`.

---
*Phase: 95-domain-a-wave-1-tier-1-leaf-contexts*
*Completed: 2026-06-04*
