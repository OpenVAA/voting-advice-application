---
resolves_phase: 131
---

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

3. **Consider replacing the deeplink test with a navigation-from-home test** that walks through the selectors and lands on `/results` via in-app navigation rather than direct URL. The popup-via-root-layout-slot contract is preserved; the cold-start storage seed race is eliminated. **NOTE 2026-05-20:** Phase 86.3-04 elevated this to the strongest v2.11+ recommendation — Path 2 (context-scoped addInitScript) was empirically disproved (see "Phase 86.3-04 attempt" section below), confirming that the root cause is deeper than addInitScript-vs-loader timing. The natural in-app navigation path (Home → Intro → Questions → Results) populates the answer-store, voter-context, and dataRoot through reactive `$effect` chains that the cold-deeplink path bypasses. Recommendation #3 sidesteps the entire race surface.

## Phase 86.3-04 attempt (2026-05-20 — augmented)

Per Phase 86.3-04 PLAN Task 1 ladder (Path 2 → Path 1 → SKIP-FALLBACK):

### Path 2 (context.addInitScript) — verified-applied, empirically insufficient

- **Change applied:** 1-line swap at `voter-popup-hydration.spec.ts:216` — `page.addInitScript(...)` → `page.context().addInitScript(...)`. Context-scoped init scripts fire before ANY navigation in the current context, closing the documented page-scoped-vs-loader timing window per RESEARCH §"Cell #6 Fix shapes §2".
- **Empirical result:** Per-cell smoke `voter-popup-hydration.spec.ts:147:3 …` fails with `Expected: > 0; Received: 0` on the `expect.poll(() => list.count(), { timeout: 15000 })` settle gate. `voter-results-list` testid never paints within 15s.
- **Trace evidence (post-fix run, 2026-05-20):**
  - Frame URL progression: `about:blank` → `http://localhost:5173/results?electionId=…&constituencyId=…` → `http://localhost:5173/results/candidates?electionId=…&constituencyId=…` (canonical 308 redirect).
  - Supabase REST calls (all 200): `app_settings?select=customization`, `app_settings?select=settings`, `elections`, `constituencies`, `constituency_groups`, `question_categories`, `questions`, `rpc/get_nominations`.
  - Page snapshot at failure (from `error-context.md`): `main [ref=e30]: generic [ref=e32]: Loading…`. NO list, NO results — same symptom as Phase 86.3-03 trace finding on `/questions`.
- **Disposition:** Path 2 swap LEFT IN PLACE in the spec body as evidence-of-attempt (mirrors Phase 86.1-03 cell 2 storage-clear LEFT IN PLACE pattern). `test.skip(true, …)` short-circuits before the executable statement; the swap is preserved purely as code-archaeology for the v2.11+ investigator.

### Path 1 (test.use storageState) — abandoned at Pitfall 4

- **Mechanism considered:** `test.use({ storageState: { origins: [{ origin: 'http://localhost:5173', localStorage: [{ name: 'VoterContext-answerStore', value: JSON.stringify(seed) }] }] }})`.
- **Blocker:** The seed value requires a question-ID-keyed answer map (`{ [questionId]: { value: 3 } }`). `questionIds` are discovered in `beforeAll` via Supabase `findData({ externalId: { $like: 'test-question-%' } })` because the e2e seed assigns UUIDs randomly per run. `test.use` is STATIC — it runs before `beforeAll`, so dynamic IDs cannot inform the seed.
- **Resolution paths considered, both out of 1h cap:**
  - **Path 1a:** Move ID discovery to module-load IIFE (top-level `await client.findData(...)`). Touches the spec's static-config layer; high blast radius.
  - **Path 1b:** Hard-code known external_ids from the e2e template (e.g., `'test-question-1'` through `'test-question-25'`) and bypass UUID lookup. Sacrifices the "discovered at runtime" pattern that's robust to template churn.

### Cross-reference to Phase 86.3-03 trace finding

Phase 86.3-03 (cell #5 voter-feedback-persistence) ALSO produced the same `Loading…` symptom but on `/questions` (via the `answeredVoterPage` fixture's `navigateToFirstQuestion` step). The trace analysis at `.planning/phases/86.3-…/86.3-03-trace-analysis.md` characterizes this as a CASCADE-class upstream loader race — Supabase REST 200s, but the SvelteKit page boundary never resolves to paint. Phase 86.3-04 cell #6 reproduces the SAME race on `/results` via direct `page.goto`, confirming the upstream loader race is shared across the voter-app deep-link surface (not specific to one route).

The next v2.11+ pickup should investigate the shared upstream loader race FIRST. Once the loader race is closed, the voter-app cold-deeplink surface (both `/questions` and `/results`) should re-enable Path 2 trivially.

## Cross-refs

- `.planning/phases/86.1-…/86.1-RESEARCH.md` §6.1 — LAYOUT-03 disposition rationale + alternative regression coverage tests
- `.planning/phases/86.1-…/86.1-CONTEXT.md` D-04 (1h investigation cap) + D-05 (cell dispositions) + D-06 (3-element skip protocol)
- `.planning/phases/86-…/86-04-SUMMARY.md` — Phase 86 PASS-WITH-DEFERRAL anchor
- `.planning/phases/86-…/86-RESEARCH.md` §3.2 — LAYOUT-03 H1 hypothesis
- `tests/scripts/diff-playwright-reports.ts` `SKIPPED_TESTS` const — Plan 86.1-04 manually adds this entry
- `tests/tests/specs/voter/voter-popup-hydration.spec.ts:122` — the skipped test
- `tests/tests/specs/voter/voter-results.spec.ts` — alternative regression coverage (cold deeplink)
- `tests/tests/specs/voter/voter-app-popups.spec.ts` — alternative regression coverage (popup surfacing)
