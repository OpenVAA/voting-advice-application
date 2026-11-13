# Phase 173 — deferred items

Discoveries outside the scope of the plan that made them. Nothing here was fixed.

## From 173-10 (one-off browser probe, 2026-10-06 20:34 local, dev server on the default project)

### 1. The terms-of-use gate view overflows a 390px viewport; its checkbox is off-screen — MEASURED, cause not diagnosed

- **Measured:** signed in as the seeded candidate at a 390 × 844 viewport, on the gate view at `/contestant`: `document.documentElement.scrollWidth` 483 against `clientWidth` 390; the four widest elements under `<main>` are 576px wide (`SECTION.flex flex-col items-center`, `DIV.mb-lg text-center`, `DIV.collapse rounded-none min-h-touch min-w-touch h-auto w-full`, `INPUT.min-h-0`); `[data-testid="terms-checkbox"]` has its left edge at x = -93, six reads 500 ms apart, no animation running. At 1280px the same view has no overflow and the checkbox is at x = 352.
- **Consequence as measured:** at a phone width the checkbox a user must tick is left of the viewport, where horizontal scrolling cannot reach.
- **Not caused by 173-10:** `git diff --stat 9ceae76c7..HEAD -- apps/frontend/src/lib/contestant/gates apps/frontend/src/lib/contestant/components/termsOfUse apps/frontend/src/lib/layouts apps/frontend/src/lib/components/expander` is empty. The view is Phase 172's (`lib/contestant/gates/TermsOfUseGate.svelte`, `TermsOfUseForm.svelte`).
- **Not established:** which element forces the 576px width (the `collapse` expander and its `INPUT.min-h-0` are the candidates); whether the entity pages or the voter app share it; whether it predates Phase 172's move of the form into a gate view. No E2E project runs the Contestant App at a phone width, so the suite cannot see it.
- **Suggested owner:** a fix plan against Phase 172's gate view before the milestone ships, with a 320px and 390px assertion.

### 2. Passing the terms-of-use gate leaves focus on `<body>` — MEASURED

- **Measured:** after the gate's Continue button, the root showed the selection view with `document.activeElement` = `BODY`; `#route-announcer` held the new title. The gate continues with `invalidateAll()`, which is not a navigation, so the root layout's `afterNavigate` focus move does not run. After every real navigation in the same probe (card → entity home, switch → selection view, refused entity URL → "nothing to edit") focus was on the page `<h1>`.
- **Scope:** the same holds for any gated user who entered through an entity URL, which predates 173-10. A single-entity user at the root is redirected after the gate, which is a navigation. 173-10 adds two more users to it: one with several entities and one with none, at the root.
- **Suggested fix:** `focusNavigationTarget()` after the gate's `invalidateAll()`, with a component case.

### 3. `Error formatting nomination: Error: Child in collection elections with id … not found` — PRE-EXISTING log line, not diagnosed

- **Observed:** one `console.error` (the app logger, level 50) during the probe, while the seeded user held temporary editor grants on a second candidate and an organization of the default dataset. No error view was rendered (`[data-testid="error-message"]` count 0).
- **Not new:** the same line is in the dev-server log of every full E2E run of this phase that was checked, three times each: `173-07-split`, `173-08-move-r2` and `173-10-screens` (`grep -c "Error formatting nomination" tests/e2e-runs/173-e2e/<label>/devserver.log`). In the suite the missing child is an election (`Child in collection elections with id … not found`).
- **Not established:** which page logs it and for which test identity; whether the page shows a nomination without its election name as a result.
- **Suggested owner:** Phase 176 (the home screen's nomination list) or whichever plan next edits the nomination formatting.

## From 173-12 (E2E run `173-12-slice`, 2026-10-06 21:31 local)

### 4. The Escape key does not close the navigation drawer — MEASURED, not judged

- **Measured:** in three cases of the entity-selection spec the open contestant menu was still visible five seconds after `Escape` (`tests/e2e-runs/173-e2e/173-12-slice`, the three failures, all at the nav-menu fixture's `closeNav`). `git grep -n -E "Escape|keydown" -- apps/frontend/src/lib/layouts apps/frontend/src/lib/dynamic-components/navigation apps/frontend/src/lib/contexts/layout` prints nothing outside tests. Opening the drawer moves focus into it.
- **What was done:** the fixture now closes the drawer through its close item (`b6897fd31`). The product is unchanged. The journey spec's `page.keyboard.press('Escape')` after its two menu assertions has no effect and was left as it is.
- **Not established:** whether the voter and admin drawers behave the same (they share `Layout.svelte`); whether the project's accessibility bar asks for Escape on a drawer that takes focus.
- **Suggested owner:** the phase's review, or the next plan that edits `lib/layouts/main/Layout.svelte`.
