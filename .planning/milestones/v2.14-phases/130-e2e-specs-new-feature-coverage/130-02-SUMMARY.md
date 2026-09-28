---
phase: 130-e2e-specs-new-feature-coverage
plan: 02
subsystem: testing
tags: [playwright, e2e, fixtures, candidate, multipleText, round-trip, EQTYP-03]

# Dependency graph
requires:
  - phase: 129-*
    provides: "MultipleTextInput row-list (UNBLK-01, plan 05) rendering test-qu-info-multipleText on the candidate profile; e2e/base multipleText info question"
  - phase: 130-*
    plan: 01
    provides: "voter-side EQTYP fixtures (fixtures-first precedent); testIds.voter.questions.multipleText* already registered"
provides:
  - "candidateProfilePage.fillMultipleTextQuestion(label, values) — row-list fill helper driving MultipleTextInput via multiple-text-row / multiple-text-add testids"
  - "MULTIPLE_TEXT_ANSWERS — 2 distinct ASCII marker values ([MULTITEXT-1]/[MULTITEXT-2]) in candidateJourneyConstants"
  - "candidate-journey steps 13 (fill) + 21 (verbatim preview round-trip) — EQTYP-03 candidate leg closed"
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Row-list fill helper: row 0 pre-renders (component floor >= 1); click multiple-text-add per extra value, then fill each row by nth index"
    - "Verbatim round-trip via distinct bracket-token markers ([MULTITEXT-1]/[MULTITEXT-2]) so no locale/normalization/encoding ambiguity can silently pass"

key-files:
  created: []
  modified:
    - tests/tests/utils/candidateJourneyConstants.ts
    - tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts
    - tests/tests/specs/candidate/candidate-journey.spec.ts

key-decisions:
  - "fillMultipleTextQuestion ensures a row exists at each target index by clicking multiple-text-add while rows.count() <= i — robust whether or not row 0 pre-renders (it does, via the component's floor of >= 1)"
  - "MULTIPLE_TEXT_ANSWERS lives in a string[] outside the INFO_QUESTION_ANSWERS Record<string,string> map because the multipleText answer is a row list; the omission NOTE was replaced with an explicit-fill pointer"
  - "Round-trip asserted via expectInfoAnswer regex marker tokens (/\\[MULTITEXT-1\\]/, /\\[MULTITEXT-2\\]/) — HARD assertions matching step 21's existing style; two calls (one per token) against the same qu-info-multipleText info item"

patterns-established:
  - "MultipleTextInput fill: locate the profile-info-item wrapper by label, then drive multiple-text-row inputs + multiple-text-add via testIds constants only (no raw selector literals)"

requirements-completed: [EQTYP-03]

coverage:
  - id: D1
    description: "EQTYP-03 candidate round-trip: 2 distinct multipleText values filled on the profile (step 13) and BOTH asserted verbatim in the candidate preview (step 21) via marker tokens"
    requirement: "EQTYP-03"
    verification:
      - kind: e2e
        ref: "tests/tests/specs/candidate/candidate-journey.spec.ts#full candidate journey end-to-end @candidate (steps 13 + 21)"
        status: pass
    human_judgment: false
  - id: D2
    description: "The multipleText question (required:false) does not perturb the required-empty submit gate — the fill is added before submit yet step 13 still lands on home with opinions disabled, and step 14's required-fill still advances to /questions"
    requirement: "EQTYP-03"
    verification:
      - kind: e2e
        ref: "tests/tests/specs/candidate/candidate-journey.spec.ts#steps 13-14 gate choreography unchanged"
        status: pass
    human_judgment: false

# Metrics
duration: ~35min
completed: 2026-07-19
status: complete
---

# Phase 130 Plan 02: EQTYP-03 Candidate MultipleText Round-Trip Summary

**fillMultipleTextQuestion row-list helper + MULTIPLE_TEXT_ANSWERS marker constants + candidate-journey steps 13 (fill) & 21 (verbatim preview round-trip), closing the EQTYP-03 candidate leg — proven by two green candidate-journey project runs.**

## Performance

- **Duration:** ~35 min
- **Completed:** 2026-07-19
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Added `MULTIPLE_TEXT_ANSWERS: ReadonlyArray<string>` (`'[MULTITEXT-1] First list value.'`, `'[MULTITEXT-2] Second list value.'`) to `candidateJourneyConstants.ts`; replaced the "intentionally omitted" NOTE on the INFO_QUESTION_ANSWERS map with an explicit-fill pointer (the answer is a `string[]`, so it cannot live in the `Record<string,string>` map).
- Added `fillMultipleTextQuestion(label, values)` to `candidateProfilePage.fixture.ts`: locates the profile-info-item wrapper by label, then for each value ensures a `multiple-text-row` exists at the target index (clicking `multiple-text-add` when missing — row 0 pre-renders via the component's floor of >= 1) and fills it. All locators use `testIds.voter.questions.multipleText*` constants — no raw selector literals.
- Wired step 13 to fill the multipleText question via `MULTIPLE_TEXT_ANSWERS` after the existing INFO_QUESTION_ANSWERS loop; the question is `required:false`, so the required-empty submit-disabled gate choreography is unchanged.
- Extended step 21 with two HARD `expectInfoAnswer` round-trip assertions — one per marker token — closing the EQTYP-03 candidate round-trip.
- **Two green candidate-journey runs** (Task 1 proof run without the round-trip assertion; Task 2 run with it), each on the running :5173 stack + clean DB: **5 passed, 0 failed, 0 skipped** each.

## Task Commits

1. **Task 1: fillMultipleTextQuestion helper + constants + step-13 fill wiring** - `4442a440c` (test)
2. **Task 2: step-21 multipleText preview round-trip assertions** - `b9930ac7f` (test)

## Files Created/Modified
- `tests/tests/utils/candidateJourneyConstants.ts` - Added `MULTIPLE_TEXT_ANSWERS` (2 distinct marker values); replaced the multipleText omission NOTE with an explicit-fill pointer. INFO_QUESTION_ANSWERS map + key-convention docstring untouched.
- `tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts` - Added `fillMultipleTextQuestion(label, values)` mirroring `fillQuestion`'s label-locate idiom, driving the MultipleTextInput row list via testIds constants with a fail-fast visible assertion before each fill.
- `tests/tests/specs/candidate/candidate-journey.spec.ts` - Imported `MULTIPLE_TEXT_ANSWERS`; step 13 calls `fillMultipleTextQuestion(/\[qu-info-multipleText\]/, [...MULTIPLE_TEXT_ANSWERS])`; step 21 asserts both `/\[MULTITEXT-1\]/` and `/\[MULTITEXT-2\]/` in the qu-info-multipleText preview info answer.

## Decisions Made
- `fillMultipleTextQuestion` ensures a row at each index by clicking `multiple-text-add` while `rows.count() <= i` — robust regardless of pre-render count (row 0 always pre-renders via the component floor of >= 1).
- Round-trip uses two `expectInfoAnswer` calls (one marker token each) against the same `qu-info-multipleText` info item; `expectInfoAnswer` accepts a RegExp `aValue` and asserts `toContainText`, so the distinct bracket-token markers make each a verbatim presence check.
- Marker values chosen as ASCII bracket tokens (`[MULTITEXT-1]` / `[MULTITEXT-2]`) so no locale/normalization/encoding transformation can silently pass a mangled value (EQTYP-03 encoding edge-probe).

## Deviations from Plan

None - plan executed exactly as written. Both tasks ran green on the first attempt; no auto-fixes, no blocking issues, no architectural decisions.

## Issues Encountered
- None. The running :5173 dev server was reused (the changes are test-side only — no product code — so the served frontend was unchanged), and `yarn db:reset` recreated the storage buckets cleanly with no 502-wedge on either run.

## Next Phase Readiness
- EQTYP-03 is fully closed: voter side (13→14 info-item flip + keyword reads, 129-08) + candidate side (fill + preview round-trip, this plan). No follow-on multipleText fixture work is required by later 130 plans.

## Self-Check: PASSED

- All 3 declared files + SUMMARY.md exist on disk.
- Both task commits (`4442a440c`, `b9930ac7f`) present in git history.
- Both candidate-journey runs pass (5 passed / 0 failed / 0 skipped each); `yarn typecheck:tests` exits 0. Acceptance greps: `MULTIPLE_TEXT_ANSWERS` x2 in constants, `fillMultipleTextQuestion` in fixture + spec, `qu-info-multipleText` x4 in spec, `MULTITEXT-1`/`MULTITEXT-2` x2 each.

---
*Phase: 130-e2e-specs-new-feature-coverage*
*Completed: 2026-07-19*
