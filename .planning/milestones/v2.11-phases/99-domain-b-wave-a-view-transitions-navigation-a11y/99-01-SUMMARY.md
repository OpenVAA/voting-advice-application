---
phase: 99-domain-b-wave-a-view-transitions-navigation-a11y
plan: 01
subsystem: ui
tags: [view-transitions, svelte5, sveltekit, a11y, navigation, wcag]

# Dependency graph
requires:
  - phase: spikes-013-016
    provides: view-transitions + focus/a11y migration blueprint (shouldAnimate, onNavigate VT coupling, afterNavigate focus reset, aria-live announcer, reduced-motion belt-and-braces)
provides:
  - "shouldAnimate(destUrl) + typed startViewTransition guard in $lib/utils/viewTransition.ts (shared helper for root layout + Plan 02 Tabs wrapper)"
  - "Root-layout onNavigate coupling that wraps the SvelteKit DOM swap in document.startViewTransition (VT-01)"
  - "Always-present aria-live=polite #route-announcer derived from page.params (NAVA11Y-01)"
  - "afterNavigate rAF focus reset to [data-focus-on-nav] (fallback first h1) with preventScroll:true (NAVA11Y-02 global half)"
  - "Reduced-motion both layers: matchMedia JS short-circuit + @media { :global(::view-transition-*) } CSS (VT-03)"
  - "?notr=1 escape hatch shipped (D-02)"
affects: [99-02 (view-transition-name placement, consumes the same helper + onNavigate coupling), 99-03 (a11y gate asserts announcer + focus behavior)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Single merged onNavigate (analytics flush THEN VT promise) — one hook, not two competing registrations"
    - "Typed View-Transition guard via local ViewTransition interface — no `any`, CLAUDE.md TS-strict compliant"
    - "Destination URL read from navigation.to?.url during onNavigate (NEVER page.url — that is the SOURCE there)"
    - "@media wraps :global(...) for view-transition CSS — never :global(@media ...) (Svelte parser landmine)"

key-files:
  created:
    - apps/frontend/src/lib/utils/viewTransition.ts
  modified:
    - apps/frontend/src/routes/+layout.svelte

key-decisions:
  - "Typed ViewTransition interface + Partial<DocumentWithViewTransition> cast instead of `as any` + eslint-disable (spike used the latter; CLAUDE.md forbids any)"
  - "startViewTransition wrapper carries its own SSR + feature-detect guard so callers can call it unconditionally after shouldAnimate gates"
  - "Tailwind's built-in sr-only utility used for the announcer (no custom .sr-only rule needed)"

patterns-established:
  - "Shared viewTransition helper consumed by root layout (Plan 01) + entity-detail Tabs wrapper (Plan 02)"
  - "Merged-not-replaced navigation hooks: analytics side-effects preserved alongside VT + focus reset"

requirements-completed: [VT-01, VT-03, NAVA11Y-01, NAVA11Y-02]

# Metrics
duration: ~12min
completed: 2026-06-04
---

# Phase 99 Plan 01: View-Transitions mechanism + navigation-a11y hooks Summary

**Landed the View-Transitions cross-fade coupling + WCAG-compliant navigation a11y (aria-live route announcer, focus reset, dual-layer reduced-motion) in the real SvelteKit root layout, backed by a shared, `any`-free `viewTransition.ts` helper.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-04
- **Completed:** 2026-06-04
- **Tasks:** 2
- **Files modified:** 2 (1 created, 1 modified)

## Accomplishments
- Created `viewTransition.ts` — `shouldAnimate()` (SSR guard + feature-detect + `prefers-reduced-motion` JS layer + `?notr=1`) and a typed `startViewTransition` wrapper, with **no `any`** (CLAUDE.md TS-strict).
- Merged View-Transitions into the root-layout `onNavigate` WITHOUT clobbering the existing `submitAllEvents()` analytics flush — single merged hook reading `navigation.to?.url` (VT-01).
- Extended the root-layout `afterNavigate` with a `requestAnimationFrame` focus reset (`[data-focus-on-nav]` → first `<h1>` fallback) using `preventScroll: true` (NAVA11Y-02 global half), preserving the existing `startPageview` analytics call.
- Added an always-present `aria-live="polite"` `#route-announcer` derived from `page.params`, placed OUTSIDE the error/loading/maintenance branches (NAVA11Y-01).
- Added the reduced-motion `@media { :global(::view-transition-*) }` CSS layer (VT-03 layer 2).
- `beforeNavigate` (app-update reload) and `onDestroy` (analytics flush) left unchanged.

## Task Commits

Each task was committed atomically:

1. **Task 1: Create the shared viewTransition helper module** - `1b3c073c4` (feat)
2. **Task 2: Merge VT + a11y hooks, announcer, and reduced-motion CSS into the root layout** - `a6857a9b9` (feat)

## Files Created/Modified
- `apps/frontend/src/lib/utils/viewTransition.ts` (created) - `shouldAnimate(destUrl)` gate + typed `startViewTransition` guard; shared by root layout + Plan 02 Tabs wrapper.
- `apps/frontend/src/routes/+layout.svelte` (modified) - merged `onNavigate` (analytics + VT promise), extended `afterNavigate` (analytics + focus reset), `#route-announcer` aria-live region, reduced-motion `<style>` block; added `page` import from `$app/state` and the `viewTransition` helper import.

## Decisions Made
- **Typed guard over `as any`:** declared a local `ViewTransition` interface + `DocumentWithViewTransition` augmentation and cast via `Partial<DocumentWithViewTransition>`. The spike used `(document as any).startViewTransition` + eslint-disable; CLAUDE.md forbids `any`, so the typed form is the canonical implementation. No eslint-disable needed.
- **`startViewTransition` carries its own SSR/feature guard** (returns `undefined` when unavailable) so the call site stays clean after `shouldAnimate` has already gated.
- **Tailwind `sr-only`** is globally available, so no custom `.sr-only` rule was added (the spike's bespoke `.sr-only` was for the standalone runes-test route).

## Deviations from Plan

None - plan executed exactly as written. (The plan explicitly permitted either a typed guard or an eslint-disable; the typed guard was chosen as the no-`any` path the plan preferred.)

## Issues Encountered
- **Pre-existing repo-wide lint errors (out of scope):** `yarn lint:check` (which runs the full Turborepo lint graph) exits 1 due to two `simple-import-sort/imports` errors in unmodified test files (`popupStore.svelte.test.ts`, `answerStore.svelte.test.ts`) and assorted pre-existing `no-unused-vars` warnings in `@openvaa/core` / `@openvaa/dev-seed`. Confirmed via `git status` that these files are untouched by this plan. The two files created/modified by this plan are individually lint-clean (`npx eslint <file>` exits 0 for both). Logged to `deferred-items.md` per the SCOPE BOUNDARY rule; not fixed.

## Verification
- `npx eslint apps/frontend/src/lib/utils/viewTransition.ts` → exit 0 (helper lint-clean, no `any`).
- `npx eslint apps/frontend/src/routes/+layout.svelte` → exit 0 (layout lint-clean).
- `yarn build` (frontend) → exit 0, `✓ built in 9.21s` (catches the `:global(@media)` Svelte-parser landmine — the correct `@media { :global(...) }` form is accepted).
- All Task 1 + Task 2 grep acceptance gates pass: `shouldAnimate`/`startViewTransition` exports, `searchParams.get('notr')`, `prefers-reduced-motion: reduce`, `typeof document === 'undefined'`, 0 `as any`; `navigation.to?.url`, `preventScroll: true`, `requestAnimationFrame`, `id="route-announcer"`, `aria-live="polite"`, `submitAllEvents` + `startPageview` preserved, `@media (prefers-reduced-motion: reduce)` present, and NO literal `:global(@media` in actual CSS.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The `onNavigate` VT coupling is live — every `view-transition-name` placed in Plan 02 will now animate (they are inert without this hook).
- The shared `viewTransition.ts` helper is ready for Plan 02's entity-detail Tabs local wrapper to import.
- The aria-live announcer + global focus reset are installed; Plan 03's a11y gate can assert them. Per-route `data-focus-on-nav` markers land in Plan 02.

## Known Stubs
None — both deliverables are fully wired (helper exported + imported by the live root layout; hooks merged into real navigation lifecycle).

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/utils/viewTransition.ts
- FOUND: apps/frontend/src/routes/+layout.svelte
- FOUND commit: 1b3c073c4 (Task 1)
- FOUND commit: a6857a9b9 (Task 2)

---
*Phase: 99-domain-b-wave-a-view-transitions-navigation-a11y*
*Completed: 2026-06-04*
