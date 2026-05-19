---
phase: 75-question-rendering-specs
plan: 01
subsystem: e2e-coverage / voter-question-rendering
tags: [playwright, e2e, voter, qspec, boolean, opinion-question, dev-seed]
completed: 2026-05-11
head_sha_at_close: c108f675ddb46d090bd2717966361cd2f20e29d9
requirements: [QSPEC-01]
dependency_graph:
  requires:
    - phase 73 (determinism baseline, closed 2026-05-11)
    - phase 74 (high-leverage-e2e-coverage, closed 2026-05-11 GREEN-WITH-DEFERRAL)
  provides:
    - test-question-boolean-1 + test-category-boolean dev-seed rows (e2e template)
    - walkToQuestion(page, sortOrder) shared helper for QSPEC-* specs
    - QSPEC-01 permanent E2E gate (4-step contract — render + answer + browser-back + entity-detail mirror)
  affects:
    - tests/tests/specs/voter/voter-matching.spec.ts navigateToResults (Skip-Next fallback bumped to 3-iter loop for sort 18)
    - tests/tests/specs/voter/voter-journey.spec.ts answerRemainingUntilResults (out-of-range guard now continues outer loop instead of returning early)
tech_stack:
  added: []
  patterns:
    - "Phase 74 P05 dev-seed extension pattern — additive question + category + Alpha answer cell (no schema migration)"
    - "Inline `// reason:` block for `getByTestId('opinion-question-input')` scope wrappers per CONTEXT D-06 + Phase 74 D-11"
    - "Auto-advance + nextButton fallback (try/catch on waitForURL) per voter-journey.spec.ts:72-86"
    - "Browser-back persistence via page.goBack() + getByRole('radio', { checked: true }).toHaveCount(1) (B-02 step 3 MANDATORY)"
    - "Entity-detail mirror exemplar — .entitySelected count=1 + radio[checked] count=1 + getByText('You') attached"
key_files:
  created:
    - tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts
    - .planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md
    - .planning/phases/75-question-rendering-specs/75-01-SUMMARY.md
  modified:
    - packages/dev-seed/src/templates/e2e.ts (added test-category-boolean + test-question-boolean-1 + Alpha answer cell + §4.1 EXCLUDED comment update)
    - tests/tests/utils/voterNavigation.ts (added walkToQuestion(page, sortOrder) helper alongside walkToQuestionsIntro)
    - tests/tests/specs/voter/voter-matching.spec.ts (Skip-Next fallback bumped to 3-iter loop — Option A)
    - tests/tests/specs/voter/voter-journey.spec.ts (out-of-range guard continues outer loop)
decisions:
  - "Skip-Next fallback verification: Option A taken. Single-Skip did NOT handle sort 18 transparently — bumped to 3-iter loop with maxSteps cap (mirrors voter-journey.spec.ts:46 pattern). Both voter-matching.spec.ts:174 + voter-journey.spec.ts:64 updated with inline `// reason:` blocks citing Phase 75 P01."
  - "Role 'radio' (not 'button') used in getByRole locators per actual DOM rendering at QuestionChoices.svelte:263-273 (<input type='radio'>). The plan's prose 'getByRole('button', { name: 'Yes' })' was informal — the accessibility tree exposes these as radios, confirmed by page snapshot during Task 2 verification."
  - "Literal English strings 'No' / 'Yes' used in locator names per W-03 deferred-todo + Phase 74 P05 'Option A/B/C' convention. Phase 78 CLEAN-04 i18n wrapper tightening migrates to t() lookups."
  - "Boolean question at sort_order 18, required: false, schema-free (no `choices` field) per questions-override.ts:53 convention."
  - "New category test-category-boolean (sort_order 6, category_type 'opinion') — NOT reusing test-category-info per CONTEXT D-02 + Claude's Discretion paragraph 4."
metrics:
  duration_minutes: 16
  tasks_completed: 5
  files_changed: 7
  commits: 4
---

# Phase 75 Plan 01: QSPEC-01 (Boolean opinion question E2E spec) Summary

QSPEC-01 Boolean opinion-question end-to-end Playwright spec landed with the 4-step contract (input renders / voter answers / browser-back persistence / entity-detail mirror) + the dev-seed e2e template extended with a new boolean question, new category, and Alpha's answer cell.

## Tasks Closed

| Task | Outcome | Files | Commit |
|------|---------|-------|--------|
| 1 — Extend e2e.ts | Added test-category-boolean (sort 6, opinion), test-question-boolean-1 (sort 18, type:'boolean', schema-free), Alpha's answer cell `{ value: true }`, updated §4.1 EXCLUDED comment | packages/dev-seed/src/templates/e2e.ts | 5f883e78c |
| 2 — Rebuild + provision + Skip-Next verification | yarn build PASS; yarn supabase:reset PASS; psql probe confirmed boolean question at sort 18 + new category + Alpha answer `{ "value": true }`. Matching tests INITIALLY FAILED — Skip-Next fallback didn't handle sort 18. Applied Option A (3-iter loop) → 10/10 matching tests pass | tests/tests/specs/voter/voter-matching.spec.ts, tests/tests/specs/voter/voter-journey.spec.ts | 0a7e07056 |
| 3 — Extract walkToQuestion helper | New exported `walkToQuestion(page: Page, sortOrder: number): Promise<void>` composing walkToQuestionsIntro + startButton click + nextButton.click() × sortOrder. JSDoc references Phase 78 CLEAN-05 Path B (--likert-only seed modifier) | tests/tests/utils/voterNavigation.ts | f461a1a17 |
| 4 — Author QSPEC-01 spec | New voter-question-rendering-boolean.spec.ts (192 lines) implementing the 4-step contract (B-02 step 3 mandatory browser-back). Smoke test 4/4 PASS in 15.1s | tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts | c108f675d |
| 5 — Dedup audit + SUMMARY + W-03 deferred-todo | This SUMMARY + W-03 i18n-hardening deferred-todo filed | .planning/phases/75-question-rendering-specs/75-01-SUMMARY.md, .planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md | (this commit) |

## Skip-Next Fallback Verification (RESEARCH Pitfall 2 + Open Question 5)

The Task 2 re-run of `voter-matching.spec.ts` matching algorithm tests against the new 18-question seed **FAILED on the first attempt**. The existing Phase 74 P05 single-Skip fallback at `voter-matching.spec.ts:167-177` did NOT handle sort 18 transparently — after the 16 ordinal answers, auto-advance lands on sort 17 (categorical); one Skip advances to sort 18 (boolean); `waitForURL(/\/results/, timeout: 30000)` then timed out because sort 18 is not /results.

**Mitigation Option A taken** (per the plan's verify-then-decide protocol):

- `voter-matching.spec.ts navigateToResults` (lines 174-191): bumped from a single Skip to a 3-iteration loop bounded by a maxSteps cap that breaks early once `/results` is reached. Inline `// reason:` block cites Phase 75 P01 + maxSteps pattern from voter-journey.spec.ts:46.
- `voter-journey.spec.ts answerRemainingUntilResults` (lines 64-79): same Phase 75 P01 issue — the out-of-range guard returned early on a single Skip, which now leaves the voter on sort 18 instead of /results. Updated the guard to `continue` the outer for-loop (not return early), so the maxSteps cap absorbs the additional Skip iteration.

**Verification re-run:** `yarn test:e2e --workers=1 --grep "matching algorithm"` → **10/10 passed** (7 matching tests + data-setup + 2 teardowns) in 2.3min.

Commit: `0a7e07056`.

## Dedup Audit Findings (BOOLEAN — feeds Plan 02a's unified artifact at 75-02-DEDUP-AUDIT.md)

| Analog | Verdict | Rationale |
|--------|---------|-----------|
| `voter-matching.spec.ts:40-43` (ordinal-only filter `singleChoiceOrdinal` expecting 8 from defaultDataset) | NO OVERLAP | Booleans are EXCLUDED by the type filter; orthogonal contract (matching ranking ≠ render-shape). |
| `voter-matching.spec.ts:99-103` (matching computation via MatchingAlgorithm with DISTANCE_METRIC.Manhattan) | NO OVERLAP | Asserts algorithm contract (distance ordering), NOT render-shape contract (input visibility, click handling, selected-state persistence, entity-detail mirror). |
| `voter-matching.spec.ts:191-217` (ranking assertions by displayed candidate names) | NO OVERLAP | Asserts ranking order, NOT render or persistence of an individual question's answer state. |
| `voter-matching.spec.ts:167-177` (Phase 74 P05 Skip-Next fallback, now bumped to 3-iter loop) | LEVERAGED, not duplicated | QSPEC-01 indirectly relies on the fallback being sort-agnostic enough to advance past the categorical at sort 17. Plan 01 Task 2 BUMPED the fallback to handle the new boolean at sort 18; QSPEC-01 itself does NOT re-test the fallback. |
| `packages/matching/tests/**/*.test.ts` — boolean references | NO OVERLAP (0 grep hits) | `grep -rn "boolean\\|Boolean" packages/matching/tests/` returns 0 lines. There are NO BooleanQuestion algorithm-level test cases in the matching package today. This is itself a coverage observation (algorithm-level boolean tests may be added in a future matching-package phase) but not a duplication concern for QSPEC-01. |

**Contract split statement:** QSPEC-01 asserts the user-flow + render-shape contract (Playwright's strength: walking the voter from Home to /results and asserting DOM state at each step). The matching-algorithm contract for booleans is asserted separately by `packages/matching/` unit tests (when they exist for booleans — currently zero) + the `voter-matching.spec.ts` ordinal-filter chain (which intentionally EXCLUDES booleans). No assertion in QSPEC-01 duplicates an existing matching-algorithm test.

These BOOLEAN findings are consolidated into Plan 02a Task 2's unified audit artifact at `.planning/phases/75-question-rendering-specs/75-02-DEDUP-AUDIT.md` (cross-plan flow per B-03 revision). Plan 02a contributes the categorical-question findings + writes the unified artifact.

## Per-Plan Smoke Outcome

`yarn test:e2e --workers=1 --grep "boolean opinion question renders"` → **4/4 passed** in 15.1s (data-setup + voter spec + 2 teardowns). Exit code 0.

## DATA_RACE Classification Recommendation for Plan 02b

The new QSPEC-01 spec is expected to land in **PASS_LOCKED** at Plan 02b's 3-run gate. Rationale:

- The spec uses deterministic locators (role/aria + scoped testIds) per CONTEXT D-06.
- No `waitForLoadState('networkidle')` invocations (post-Phase-73 lint rule at 'error').
- Auto-advance race handled via try/catch + nextButton fallback (battle-tested pattern from voter-journey.spec.ts:72-86, lands in PASS_LOCKED in Phase 73 baseline).
- Browser-back assertion (`page.goBack()` + radio :checked) is deterministic — Svelte 5 `bind:group={selected}` re-mounts with the prior value from the answer store on route re-entry.
- No imgproxy / image-rendering surface touched (text-only boolean radios).

If the spec lands in DATA_RACE at Plan 02b, per-test rationale per CONTEXT D-07 must classify the failure mode (env-gated / infrastructure flake / deferred bug).

## Follow-up Todos Filed

- `.planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md` (W-03 deferred — switch QSPEC-* literal English strings to `t('common.answer.{no,yes}')` and equivalent for categorical labels when Phase 78 CLEAN-04 i18n wrapper tightening lands).
- `58-E2E-AUDIT.md` addendum (recommended-but-not-blocking per CONTEXT Claude's Discretion paragraph 5) — add the new boolean question + category to the audit either at Plan 01 close OR Plan 02 close. Operator's call; not blocking phase close.

## Cross-Links

- **ROADMAP §"Phase 75"** — `.planning/ROADMAP.md:197-207` (4 success criteria; SC #1 covered by Plan 01).
- **CONTEXT D-01..D-10** — `.planning/phases/75-question-rendering-specs/75-CONTEXT.md` (binding implementation decisions).
- **RESEARCH §1-10 + Pitfalls 1-6** — `.planning/phases/75-question-rendering-specs/75-RESEARCH.md` (10 findings, Pitfall 2 = Skip-Next at sort 18 = Option A applied; Pitfall 6 = answeredVoterPage Likert-only loop incompatibility).
- **PATTERNS file-by-file analogs** — `.planning/phases/75-question-rendering-specs/75-PATTERNS.md` (dev-seed + walkToQuestion + spec authoring patterns).
- **VALIDATION map** — `.planning/phases/75-question-rendering-specs/75-VALIDATION.md` (per-task verification map).
- **Phase 74 P05** — `.planning/phases/74-high-leverage-e2e-coverage/74-05-PLAN.md` + SUMMARY (direct precedent for dev-seed + spec pattern).

## Self-Check: PASSED

Verified at SUMMARY-write time:

- packages/dev-seed/src/templates/e2e.ts — modified (test-category-boolean + test-question-boolean-1 + Alpha answer cell): FOUND
- tests/tests/utils/voterNavigation.ts — modified (walkToQuestion helper): FOUND
- tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts — created (192 lines, 4-step contract): FOUND
- tests/tests/specs/voter/voter-matching.spec.ts — modified (3-iter Skip loop, Option A): FOUND
- tests/tests/specs/voter/voter-journey.spec.ts — modified (out-of-range guard continues outer loop): FOUND
- .planning/todos/pending/2026-05-12-qspec-01-i18n-hardening.md — created (W-03 deferred-todo): FOUND
- Commits 5f883e78c (Task 1), 0a7e07056 (Task 2), f461a1a17 (Task 3), c108f675d (Task 4) — all present in git log: FOUND

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Skip-Next fallback did not handle sort 18 transparently**
- **Found during:** Task 2 (initial matching-algorithm test run)
- **Issue:** RESEARCH Pitfall 2's "verify-then-decide" predicted single-Skip might be sort-agnostic — verification showed it was NOT. `waitForURL(/\/results/, timeout: 30000)` timed out because Skip from sort 17 lands on sort 18 (boolean), not /results.
- **Fix:** Option A per the plan — bumped `voter-matching.spec.ts navigateToResults` to a 3-iter loop bounded by maxSteps; also fixed the parallel issue in `voter-journey.spec.ts answerRemainingUntilResults` (out-of-range guard returned early on single Skip; updated to `continue` outer loop).
- **Files modified:** tests/tests/specs/voter/voter-matching.spec.ts, tests/tests/specs/voter/voter-journey.spec.ts
- **Commit:** 0a7e07056

**2. [Rule 1 - Bug] Plan's prose specified `getByRole('button', { name: 'Yes' })` but the DOM renders the boolean choices as `<input type="radio">` (role: 'radio', not 'button')**
- **Found during:** Task 4 (spec authoring + smoke test)
- **Issue:** The Phase 74 P05 prose convention "boolean buttons render via role + name" was informal English; the actual rendered DOM at `QuestionChoices.svelte:263-273` is `<input type="radio">` with role "radio" (confirmed by Playwright page snapshot during Task 2 verification).
- **Fix:** Used `getByRole('radio', { name: 'Yes' })` (semantically correct + matches accessibility tree). Playwright auto-handles label-wrapped radio clicks identically to button clicks.
- **Files modified:** tests/tests/specs/voter/voter-question-rendering-boolean.spec.ts (initial authoring)
- **Commit:** c108f675d

No other deviations. Plan executed as designed with Option A applied per the verify-then-decide protocol.

## Authentication Gates

None encountered. All operations are anonymous voter flow + admin-client psql probes against the local Supabase instance.

## Known Stubs

None. No hardcoded empty values or placeholder text introduced. All wired data flows through real Supabase rows seeded by the e2e template via `runPipeline + Writer.write`.

## Threat Flags

None. Plan 01 adds 1 question + 1 category + 1 candidate-answer cell — all under the existing `test-` external_id prefix covered by `runTeardown('test-', client)`. No new attack surface; threat register T-75-01-01..03 accepted at PLAN.md time, unchanged at close.
