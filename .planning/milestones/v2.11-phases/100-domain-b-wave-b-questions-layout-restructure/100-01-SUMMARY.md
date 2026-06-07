---
phase: 100-domain-b-wave-b-questions-layout-restructure
plan: 01
subsystem: e2e-tests / voter-questions
tags: [e2e, playwright, voter-journey, answer-survival, QLAYOUT-02, D-03, wave-0-gate]
requires:
  - "tests/tests/specs/voter/voter-journey.spec.ts (existing serial voter journey test + expectQuestionAndAdvance helper)"
  - "apps/frontend questions route answer persistence (voterCtx.answers) — read-only, unchanged"
provides:
  - "D-03 answer-survival regression gate: voter-journey asserts a previously-set answer survives a multi-step Q→Q run that crosses a question.type boundary"
affects:
  - "Plan 100-02 (questions-layout restructure) — this gate must stay green after the layout hoist"
tech_stack:
  added: []
  patterns:
    - "Reuse of expectQuestionAndAdvance + in-app previousButton back-navigation + toBeChecked survival assertion (mirrors existing lines 561-573 / 599-602)"
key_files:
  created: []
  modified:
    - "tests/tests/specs/voter/voter-journey.spec.ts (D-03 test.step appended at line 630; 44 insertions)"
decisions:
  - "Placed the D-03 step immediately after the base-category answer loop (post line 617), where Base-1..5 are all answered and the Boolean<-Likert type boundary has already been crossed — no extra setup, no flow disruption."
  - "Back-navigation uses the in-app previousButton (not page.goBack()) to match the surrounding base-category steps (lines 599-602) for determinism."
  - "Forward re-advance via expectQuestionAndAdvance({ allowPreselected: true }) lands back on Base-5 (Boolean), preserving the original walk so the next step (Opt-A category intro) starts from the same position as before."
metrics:
  duration: ~2min
  completed: 2026-06-04
  tasks: 1
  files: 1
requirements-completed: [QLAYOUT-02]
---

# Phase 100 Plan 01: Questions Layout Restructure — D-03 Answer-Survival Gate Summary

Appended the D-03 / QLAYOUT-02 answer-survival assertion to the existing `voter-journey.spec.ts`: after a multi-step Q→Q run that crosses the Base-5 Boolean ← Base-4 Likert4 question-type boundary, navigate back across that boundary and assert the earlier (Likert) question's last option is still checked — the exact behavior the Phase 100 layout restructure (Plan 02) must preserve.

## What Was Built

A single `test.step('D-03 answer survives a multi-step Q→Q run across a question-type boundary', ...)` inserted into the existing serial `test('full voter journey end-to-end', ...)` block, immediately after the base-category answer loop (after the prior step at line 617). It:

1. Confirms the walk is currently on the post-boundary Boolean question (`TEXT_RE.baseOpinion5Boolean`).
2. Navigates BACK one step across the Boolean→Likert type boundary via the in-app `previousButton` (`testIds.voter.questions.previousButton`).
3. Asserts the earlier (Likert) question's previously-selected last option is STILL checked: `expect(answerOptions.last()).toBeChecked({ timeout: TIMEOUTS.element })` — the D-03 survival contract. A soft sanity assertion confirms the back-target heading is NOT the Boolean question (the round-trip genuinely crossed the type boundary).
4. Re-advances forward via `expectQuestionAndAdvance({ page, allowPreselected: true })`, landing back on the answered Boolean question with state intact and leaving the walk position unchanged for the following step.

The step carries a `// reason:` comment naming it the D-03 QLAYOUT-02 answer-survival gate and explaining that the type-boundary crossing is what exercises the `{#key question.type}` remount path (vs. a same-variant run). All locators are `testIds.*` / fixture-scoped (no bare `page.locator` / `page.getByText`); all timeouts use `TIMEOUTS.*` constants; serial mode and the `JOURNEY_TEST_MAX` timeout are untouched.

## Why It Works Today (baseline for Plan 02)

SvelteKit reuses `questions/[questionId]/+page.svelte` across param-only hops (the page derives `question` via `$derived` rather than remounting — documented in the load-bearing SETTLE-BEFORE-COUNT comment at `voter-journey.spec.ts:211-227`), so answers persist via `voterCtx.answers`. The assertion therefore passes on the current pre-restructure tree, establishing the baseline. After Plan 02 hoists rendering into `questions/+layout.svelte`, the SAME assertion proves answers survive Q→Q with no regression across the `{#key question.type}` remount.

## Verification

- `npx tsc -p tests/tsconfig.json --noEmit` → exit 0.
- `npx eslint tests/tests/specs/voter/voter-journey.spec.ts` → exit 0 (no raw-locator / conditional-in-test violations).
- Acceptance-criteria greps (all pass):
  - `page.goBack|previousButton` count: 4 → 8 (back-navigation step added).
  - `toBeChecked` count: 2 → 3 (+1 survival assertion).
  - New `*.spec.ts` files under `tests/tests/specs/voter/`: 0 (append, not a new spec).
  - Bare `page.locator(` / `page.getByText(` in added lines: 0.
  - Frontend files modified: 0.
- Commit `22a93ba48` introduced 0 file deletions.

**Operator/wave gate (not blocking this autonomous plan):** the full functional E2E confirmation — `yarn db:reset && yarn db:seed --template e2e/base --likert-only && yarn dev` then `yarn test:e2e --project=voter-journey` GREEN on the pre-restructure tree — requires a live stack and is the Phase 101 milestone-close gate. Per the plan's verification block this is the operator/wave gate, deferred out of this autonomous commit.

## Deviations from Plan

None — plan executed exactly as written. The append landed at the planned location (after the base-category loop, across the documented Likert→Boolean boundary using the `optionIndex: (n) => n - 1` last-option convention), reusing `expectQuestionAndAdvance` + `previousButton` with no new spec or frontend change.

## Threat Surface

No new trust boundary, I/O, auth, network, or input-validation surface. Per the plan's threat register (T-100-01 accept / T-100-SC N/A), this is a pure test-only change that READS UI state via testIds; no production code touched, no package installs.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: `tests/tests/specs/voter/voter-journey.spec.ts` (D-03 step at line 630).
- FOUND: commit `22a93ba48` in git log.
