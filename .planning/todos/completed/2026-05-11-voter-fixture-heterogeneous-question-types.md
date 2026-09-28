---
created: 2026-05-11
priority: high
resolves_phase: 78
escalated_from: 73-03
status: resolved-by-CLEAN-05
chosen_path: B
chosen_modifier: --likert-only
operator_decision_date: 2026-05-11
resolved_date: 2026-05-12
resolved_by_plan: 78-05
resolved_commits:
  - "8f1392fd1 test(78-05): add failing tests for --likert-only CLI flag"
  - "15435d4df feat(78-05): add --likert-only CLI flag to @openvaa/dev-seed"
tags: [tests, fixtures, voter, race-fix, escalation, scoped-to-phase-78, resolved]
---

> **Resolution addendum (2026-05-12, Phase 78 Plan 05):** Path B `--likert-only` landed.
>
> - `@openvaa/dev-seed` CLI now accepts `--likert-only` (`packages/dev-seed/src/cli/seed.ts` + new `src/cli/likert-only.ts`).
> - Filter keeps all info questions (Phase 76+77 additions preserved) and restricts opinion questions to `singleChoiceOrdinal` — produces a 16-ordinal-opinion + N-info seed shape compatible with the existing voter-fixture Likert loop.
> - `tests/tests/fixtures/voter.fixture.ts` annotated with `// reason:` line referencing the `--likert-only` seed-mode dependency (≤1 LOC change per CONTEXT D-13).
> - 16 voter-app tests previously parked in the post-73 DATA_RACE pool unblocked at the seed level; full 3-run cold-start determinism verification deferred to Phase 78 Plan 07.
> - Heterogeneous-question-type voter-fixture coverage (Path A) remains OUT OF SCOPE per the "Recommended Fix Shape" section below — deferred to a future-milestone backlog item.

> **Operator decision (2026-05-11):** Path B locked in with the `--likert-only` seed modifier (CLI flag form). Scoped into Phase 78 CLEAN-05 — see `.planning/REQUIREMENTS.md §CLEAN-05` and `.planning/ROADMAP.md §"Phase 78"` SC #5. Path A (universal `answerCurrentQuestion` dispatcher) explicitly NOT chosen — heterogeneous-question-type coverage deferred to a future-milestone backlog item.

# Voter fixture cannot answer heterogeneous question types — 16 voter-app failures cascade

**Source**: Phase 73 Plan 03 race investigation (per CONTEXT D-05 cap check)
**Affected tests** (16 consistent failures × 3 cold-start runs per `73-01-INVENTORY.md` Post-Hotfix Re-Capture):
- `voter-app :: voter-detail.spec.ts` — 4 tests
- `voter-app :: voter-journey.spec.ts > should show questions intro page with start button`
- `voter-app :: voter-matching.spec.ts > should display candidates in correct match ranking order`
- `voter-app :: voter-results.spec.ts` — 12 tests
- `voter-app-settings :: voter-settings.spec.ts > should show category checkboxes when allowCategorySelection enabled` (also cascades through this fixture)

All 16 failures share a single root cause at `tests/tests/fixtures/voter.fixture.ts:85` —
`await page.waitForURL(/\\/results/, { timeout: 30000 })` exhausts.

## Root Cause (confirmed via trace evidence)

The current `answeredVoterPage` fixture assumes:

1. The seed has exactly **16 opinion questions** (8 default + 8 voter dataset).
2. **All questions are Likert-5** (singleChoiceOrdinal), with answer index 4 ("Strongly agree") always present.
3. Auto-advance triggers cleanly between every question.

The actual e2e seed has grown to **40 questions** with **heterogeneous types**:

- Q1–Q16: singleChoiceOrdinal (Likert-5) — fixture works
- Q17+: mix of categorical (3 options), boolean, date, number, text — `answerOption.nth(4)` is invisible
- Question 25 trace (recorded in `playwright-results/voter-results-voter-result-57295.../error-context.md`)
  shows a categorical question with only 3 radio buttons ("Hull" / "Brooch" / "Contract") —
  `answerOption.nth(4)` does not exist on this page.

The fixture loop answers 16 Likert questions cleanly (Q1–Q16), reaches Q17, sees no Likert
index-4 option (it's a non-Likert question), then either:
- (a) Phase 73-03 fix attempt: `waitForNextQuestion` at voterNavigation.ts:215 times out at 10s
  waiting for the answer option that doesn't exist on a non-Likert question.
- (b) Original behavior: the post-loop `nextButton.click()` advances by 1 to Q18 (not /results),
  and `waitForURL(/\\/results/, { timeout: 30000 })` exhausts.

## Phase 73 Plan 03 Cap-Check Decision

Per CONTEXT D-05: code-level fix lands in Phase 73 if **≤50 LOC, ≤2 files**.

A correct fix requires:

1. **Question-type detection** per page (probe DOM to determine which testId pattern is present).
2. **Per-type answer strategy**: Likert (radio at index N), categorical (radio at index 0), boolean
   (radio "yes" or "no"), date (fill date input), number (fill numeric input), text (fill textarea).
3. **Locator inventory expansion** in `testIds.ts` to expose the per-type answer testIds
   (`voter.questions.answerOption` is Likert-specific).
4. **`voterNavigation.ts` changes** to handle the new question-type branches in
   `clickThroughIntroPages` and `waitForNextQuestion`.

Estimated scope: **80–120 LOC across 3 files** (`voter.fixture.ts`, `voterNavigation.ts`,
`testIds.ts`). Exceeds the ≤50 LOC / ≤2 file cap → ESCALATE.

## Recommended Fix Shape (for follow-up phase)

Two viable paths:

### Path A: Universal "answer-this-question" helper

Add a new helper `answerCurrentQuestion(page)` in `voterNavigation.ts` that:

1. Probes the page for known question-type root testIds.
2. Dispatches to a type-specific `answerLikert` / `answerCategorical` / `answerBoolean` / etc.
3. Each type-specific function picks a deterministic answer (first available option for categorical;
   arbitrary middle date for date; integer "1" for number; "test" for text).

Then refactor `voterAnswerPage` to call this in a `for i < voterAnswerCount; ; ; if (page.url().includes('/results')) break` loop.

Estimated: ~60 LOC in `voterNavigation.ts` + ~10 LOC in `voter.fixture.ts` + 4-6 new testId entries
in `testIds.ts`.

### Path B: Restrict the e2e seed to Likert questions only

Add a `voterFixtureOnlyLikert` template override or a `--likert-only` seed mode that produces a
suite where all 16 (or fewer) opinion questions are singleChoiceOrdinal. The fixture stays simple.

Estimated: ~15 LOC in `packages/dev-seed/src/templates/e2e.ts` + 1 LOC change in fixture default.

**Path B is preferable** because it preserves the fixture's "happy path" contract (Likert-only voter
journey is the simplest expressive surface) and shifts the multi-question-type coverage to dedicated
spec(s) that exercise heterogeneous flows explicitly. **Operator chose Path B on 2026-05-11 with `--likert-only` as the CLI-flag form** (rather than the alternative `voterFixtureOnlyLikert` template-override form). Scoped into Phase 78 CLEAN-05.

## Until then: leave failing tests in post-73 DATA_RACE pool

Per CONTEXT D-02 + D-05, these 16 failures remain in the post-73 DATA_RACE pool with rationale:

> "Fixture-level type-handling gap: e2e seed has 40 heterogeneous questions; the `answeredVoterPage`
> fixture only handles 16 Likert questions. Fix exceeds Phase 73 ≤50 LOC / ≤2 file cap (estimated
> 60-120 LOC across 3 files). Tracked at `.planning/todos/pending/2026-05-11-voter-fixture-heterogeneous-question-types.md`.
> Document in Phase 73-VERIFICATION.md."

Phase 73 Plan 03's substantive scope (12 lint-warning rewrites, paired DETERM-02 race-fix patterns)
is complete; the cluster's lint-clean state is achieved and the in-test conditional rewrites do not
mask any new race that this fixture-level escalation hides — Plan 02's 3-run baseline confirmed 0
flaky × 3 with these 16 tests failing consistently (deterministic-fail, not flaky).

## Verification (post-fix)

After Path A or Path B lands:

```bash
# Smoke
yarn dev:reset-with-data
yarn playwright test -c ./tests/playwright.config.ts --grep "voter-results|voter-detail|voter-journey|voter-matching|voter-settings" --workers=1

# Expect: 0 fixture-level failures; the 16 tests that previously cascaded
# should now reach /results within the fixture and run their actual assertions.
```

## References

- 73-01-INVENTORY.md §"New Failures Surfaced (NOT in original 36-pool)"
- 73-02-SUMMARY.md "key-decisions" entry on `answeredVoterPage` fixture timeout root cause
- 73-03-PLAN.md scope expansion note (INVENTORY-driven: "scope expanded from lint hygiene only to lint + 16 race fixes")
- 73-03-SUMMARY.md "Race fixes that escalated past cap" section
- `tests/playwright-results/voter-results-voter-result-57295-eded-RESULTS-01-RESULTS-02--voter-app/error-context.md` — trace showing Q25/40 with 3-option categorical question
