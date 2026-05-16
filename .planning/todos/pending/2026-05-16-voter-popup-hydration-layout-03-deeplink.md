# Voter-popup-hydration LAYOUT-03 deeplink — v2.11+ deferral

**Phase 86.1-03 cell 1 disposition:** SKIPPED per CONTEXT D-05 (no fix attempt). Inherits Phase 86-04 PASS-WITH-DEFERRAL verdict.

**Phase:** 86.1-pre-phase-87-convergence-sweep
**Plan:** 03
**Cell:** 1 (DETERM-12)
**Spec:** `tests/tests/specs/voter/voter-popup-hydration.spec.ts:122`
**Test name:** `voter-app :: specs/voter/voter-popup-hydration.spec.ts > setTimeout popup on full page load (LAYOUT-03 regression gate) popup appears on full page load to /results (LAYOUT-03 hydration path)`

## Summary

The LAYOUT-03 deeplink test asserts that a `setTimeout`-triggered `popup.push(...)` surfaces through the root layout popup slot when `/results` is reached via a full page load (SSR + hydration path). On full-suite cold-start runs (3/3 in Phase 85-04 + Phase 86 baselines), the cold-start `addInitScript` `VoterContext-answerStore` seed races the `(voters)/(located)/+layout.ts` loader: the `voter-results-list` testid never appears within the 15s `expect.poll()` settle window. Per Phase 86-04 SUMMARY the test was already accepted as PASS-WITH-DEFERRAL; Phase 86.1-03 cell 1 formalizes the deferral by converting the failing assertion to `test.skip(true, '…')`.

## Hypothesis history

- **Phase 86-01 fix (verified-applied; insufficient):** Replaced bare `toBeVisible()` on the results-list locator with an `expect.poll(() => list.count(), { timeout: 15000 })` settle gate at lines 165-171. The poll closed the bare-visibility race but did NOT close the deeper `addInitScript`-vs-loader race. On full-suite cold-start the poll still times out at 15s because the loader has not yet populated the answer store when the results-list paint is attempted.
- **Phase 86-04 verdict:** PASS-WITH-DEFERRAL accepted. Alternative regression coverage exists in PASS_LOCKED:
  - `voter-app :: specs/voter/voter-results.spec.ts > drawer paints before list on cold deeplink (D-10 source-order + content-visibility)` — covers the same SSR + hydration path on `/results` without the `addInitScript` localStorage seed contention.
  - `voter-app-popups :: specs/voter/voter-app-popups.spec.ts > should show feedback popup after delay on results page` — covers the popup-surfacing-through-root-layout-slot contract.
  - `voter-app-popups :: specs/voter/voter-app-popups.spec.ts > should show survey popup after delay on results page` — additional popup surface coverage.
- **Project-wide `--likert-only` seed flip (research-DISPROVED):** Per Phase 86 RESEARCH §3.10, would regress 60+ PASS_LOCKED cells. Not viable.
- **Per-spec fixture override (RESEARCH §3.10):** Risk-unbounded — settings persistence leaks across adjacent tests in the `voter-app` project.

## Recommended v2.11+ next action

Two parallel investigations should be considered before re-enabling:

1. **Re-examine the `addInitScript` localStorage seed pattern itself.** `addInitScript` runs before the page's scripts but the seeded `VoterContext-answerStore` may not be observed by the `(located)/+layout.ts` loader if the loader reads from the user-data context (which is itself hydrated from `localStorage` in a `$effect` that fires after layout-load). Consider whether the seed should also write a `_locale` / `selectedElectionIds` / `selectedConstituencyIds` localStorage entry so the `(located)` gate does not need to redirect.

2. **Examine whether the `(voters)/(located)/+layout.ts` loader can `await` the storage seed propagation.** A defensive `waitForLoadState('domcontentloaded')` between `addInitScript` and `page.goto` may NOT be enough — the storage write is synchronous but the user-data context's `$effect` chain is reactive.

3. **Consider replacing the deeplink test with a navigation-from-home test** that walks through the selectors and lands on `/results` via in-app navigation rather than direct URL. The popup-via-root-layout-slot contract is preserved; the cold-start storage seed race is eliminated.

## Cross-refs

- `.planning/phases/86.1-…/86.1-RESEARCH.md` §6.1 — LAYOUT-03 disposition rationale + alternative regression coverage tests
- `.planning/phases/86.1-…/86.1-CONTEXT.md` D-04 (1h investigation cap) + D-05 (cell dispositions) + D-06 (3-element skip protocol)
- `.planning/phases/86-…/86-04-SUMMARY.md` — Phase 86 PASS-WITH-DEFERRAL anchor
- `.planning/phases/86-…/86-RESEARCH.md` §3.2 — LAYOUT-03 H1 hypothesis
- `tests/scripts/diff-playwright-reports.ts` `SKIPPED_TESTS` const — Plan 86.1-04 manually adds this entry
- `tests/tests/specs/voter/voter-popup-hydration.spec.ts:122` — the skipped test
- `tests/tests/specs/voter/voter-results.spec.ts` — alternative regression coverage (cold deeplink)
- `tests/tests/specs/voter/voter-app-popups.spec.ts` — alternative regression coverage (popup surfacing)
