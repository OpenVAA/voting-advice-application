---
phase: 99-domain-b-wave-a-view-transitions-navigation-a11y
plan: 04
subsystem: frontend-navigation-a11y
tags: [a11y, navigation, route-announcer, svelte5, layout-context, localization, gap-closure]
gap_closure: true
requires:
  - "99-01: always-present #route-announcer aria-live region in root +layout.svelte"
  - "99-02: afterNavigate focus reset + QuestionHeading data-focus-on-nav marker"
  - "Phase 95: token-keyed layoutContext rune registry idiom (useTopBar/usePageStyles)"
provides:
  - "LayoutContext.routeTitle: reactive RouteTitle signal (readonly current)"
  - "LayoutContext.setRouteTitle(title): declarative $effect-scoped registrar with teardown reset"
  - "Localized route-announcer text on ALL routes (title-minus-constants)"
affects:
  - "apps/frontend root layout route announcer (NAVA11Y-01) on every route"
  - "MainContent / SingleCardContent layout components (all standard + single-card pages)"
tech_stack:
  added: []
  patterns:
    - "Rune signal on layout context (state-backed getter + effect-scoped registrar) mirroring Phase 95 token-keyed overlay registry"
    - "untrack() write-after-read guard on effect-driven signal writes (SettingsOverlay invariant)"
    - "Context reactive accessor read via ctx.X.current / $derived, never destructured (CLAUDE.md Context Destructuring Rule)"
key_files:
  created: []
  modified:
    - apps/frontend/src/lib/contexts/layout/layoutContext.type.ts
    - apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts
    - apps/frontend/src/routes/MainContent.svelte
    - apps/frontend/src/routes/SingleCardContent.svelte
    - apps/frontend/src/routes/+layout.svelte
    - tests/tests/specs/a11y/a11y-smoke.spec.ts
decisions:
  - "setRouteTitle owns its own $effect (assign-on-run + cleanup-resets-to-empty); callers invoke it inside their own $effect reading the reactive title prop, so the outer effect re-runs on title change and the inner registrar effect is torn down (reset) + recreated (new title) — last-writer-wins, only one title-bearing layout component mounted per page"
  - "Reused the existing already-localized title prop as the announcer source — NO new i18n strings authored (D-03 honored as reframed by the operator disposition)"
  - "questionId slug extracted from the URL last path segment in the spec; announcer asserted to NOT contain the slug AND to equal the visible localized question heading textContent"
metrics:
  duration: ~12min
  tasks: 3
  files: 6
  completed: 2026-06-04
---

# Phase 99 Plan 04: Localize Route Announcer (CR-01 / NAVA11Y-01) Summary

Closed CR-01 (NAVA11Y-01) by replacing the root `#route-announcer`'s hardcoded-English `Question <slug>` / `Questions list` template — which leaked the opaque DB `questionId` slug to screen-reader users — with the active route's already-localized page title (the value fed to the document `<title>` minus the constant app-name suffix), surfaced on ALL routes via a new `routeTitle` rune signal on the layout context that `MainContent` / `SingleCardContent` register their localized `title` prop into.

## What Was Built

- **`LayoutContext.routeTitle` + `setRouteTitle`** — a `$state('')`-backed reactive signal (`readonly current`) plus a declarative, `$effect`-scoped registrar that writes the active route's localized title and resets to the empty string on the calling component's teardown (so a route without a title-bearing component never announces a stale title). Mirrors the Phase 95 `useTopBar` / `usePageStyles` idiom; the effect-driven writes are wrapped in `untrack(...)` per the SettingsOverlay write-after-read invariant.
- **`MainContent.svelte` / `SingleCardContent.svelte`** — each destructures the stable `setRouteTitle` function from `getLayoutContext()` and calls it inside a `$effect(() => setRouteTitle(title))` so the registrar re-runs when the reactive localized `title` prop changes. `SingleCardContent` gained the `getLayoutContext` import (it previously imported only the component context).
- **`+layout.svelte`** — captures the context from `initLayoutContext()` into `layoutCtx`, aliases `const routeTitle = $derived(layoutCtx.routeTitle.current)` (property access, not destructured, per the CLAUDE.md Context Destructuring Rule), and rebinds the `#route-announcer` body to `{routeTitle}`. The hardcoded `page.params.questionId` template and the `Questions list` literal are deleted; the now-unused `page` import is removed. `aria-live="polite"`, `aria-atomic="true"`, `class="sr-only"`, `id="route-announcer"`, and the OUTSIDE-the-error/loading/maintenance-branches placement are all preserved.
- **`a11y-smoke.spec.ts`** — `assertRouteDerivedAnnouncer` now asserts the question-route announcer (1) does NOT contain the raw `questionId` slug extracted from the URL and (2) equals the trimmed visible question-heading textContent, proving it speaks the localized title rather than the slug. Added an `aria-atomic="true"` structural check; preserved the intro-vs-question difference assertion, the axe 0-violation gate, and the `?notr=1` determinism navigation. Doc-comments updated from the D-03 generic-param-label note to the localized-title source.

## Tasks Completed

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Add routeTitle signal + setRouteTitle registrar to layout context | c3ec7cf37 | layoutContext.type.ts, layoutContext.svelte.ts |
| 2 | Register localized title from MainContent/SingleCardContent + rebind announcer | 0de86a8a5 | MainContent.svelte, SingleCardContent.svelte, +layout.svelte |
| 3 | Update a11y-smoke NAVA11Y-01 assertion to localized-title source | 06f62b877 | a11y-smoke.spec.ts |

## Verification Results

- `cd apps/frontend && yarn build` — exits 0 (built in 9.35s after all three tasks).
- `npx eslint` on all five touched frontend files — exits 0.
- `npx eslint --flag v10_config_lookup_from_file tests/tests/specs/a11y/a11y-smoke.spec.ts` — exits 0 (the `--flag` is required so the playwright plugin's rule definitions resolve from the file's project config; a bare `npx eslint` falsely reports the two `eslint-disable` rule names as "not found").
- `tsc -p tests/tsconfig.json --noEmit` — exits 0 (spec typechecks under the tests tsconfig).
- `grep -F 'Questions list' +layout.svelte` and `grep -F 'page.params.questionId' +layout.svelte` — both return nothing (hardcoded English template + literal are gone).
- No new files under `apps/frontend/src/lib/i18n/translations/` (no new announcement i18n strings — D-03 honored).
- `grep -c assertAxeGates a11y-smoke.spec.ts` = 6 (unchanged); `grep -c networkidle a11y-smoke.spec.ts` = 0 (unchanged).

The live `PLAYWRIGHT_A11Y=1 yarn test:e2e --project=a11y-smoke` green gate remains an operator/UAT item (the pre-existing `voter-journey.fixture.ts:130` located-fixture/seed blocker is out of this plan's scope per 99-VERIFICATION.md human_verification item 1).

## Deviations from Plan

None — plan executed exactly as written. The `page` import removal in `+layout.svelte` (Task 2 conditional step) was performed because, after deleting the announcer template, `page` was referenced only in comments; `updated` from the same `$app/state` import remains in use and was retained.

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/contexts/layout/layoutContext.type.ts
- FOUND: apps/frontend/src/lib/contexts/layout/layoutContext.svelte.ts
- FOUND: apps/frontend/src/routes/MainContent.svelte
- FOUND: apps/frontend/src/routes/SingleCardContent.svelte
- FOUND: apps/frontend/src/routes/+layout.svelte
- FOUND: tests/tests/specs/a11y/a11y-smoke.spec.ts
- FOUND commit: c3ec7cf37 (Task 1)
- FOUND commit: 0de86a8a5 (Task 2)
- FOUND commit: 06f62b877 (Task 3)
