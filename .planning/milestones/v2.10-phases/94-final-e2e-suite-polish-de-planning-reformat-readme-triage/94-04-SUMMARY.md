---
phase: 94-final-e2e-suite-polish-de-planning-reformat-readme-triage
plan: 04
subsystem: e2e-tests
tags: [de-planning, candidate-suite, comment-hygiene, title-reformat, readme-triage]
requires: ["94-01"]
provides:
  - "De-planned candidate fixtures (12) + setup (2) + specs (2)"
  - "candidate-journey.README.md deleted"
affects:
  - "tests/tests/fixtures/candidate/"
  - "tests/tests/setup/candidate/"
  - "tests/tests/specs/candidate/"
tech-stack:
  added: []
  patterns:
    - "Plain-language test/step titles; current-intent comments only"
key-files:
  created: []
  modified:
    - tests/tests/fixtures/candidate/candidate-journey.ts
    - tests/tests/fixtures/candidate/candidateForgotPasswordPage.fixture.ts
    - tests/tests/fixtures/candidate/candidateHomePage.fixture.ts
    - tests/tests/fixtures/candidate/candidateLoginPage.fixture.ts
    - tests/tests/fixtures/candidate/candidateLogoutButton.fixture.ts
    - tests/tests/fixtures/candidate/candidatePasswordSetter.fixture.ts
    - tests/tests/fixtures/candidate/candidatePreviewPage.fixture.ts
    - tests/tests/fixtures/candidate/candidateProfilePage.fixture.ts
    - tests/tests/fixtures/candidate/candidateQuestionPage.fixture.ts
    - tests/tests/fixtures/candidate/candidateQuestionsOverviewPage.fixture.ts
    - tests/tests/fixtures/candidate/candidateTermsOfUsePage.fixture.ts
    - tests/tests/fixtures/candidate/perm-l10n.ts
    - tests/tests/setup/candidate/candidate-journey.setup.ts
    - tests/tests/setup/candidate/candidate-journey.teardown.ts
    - tests/tests/specs/candidate/candidate-journey.spec.ts
    - tests/tests/specs/candidate/candidate-bank-auth.spec.ts
  deleted:
    - tests/tests/specs/candidate/candidate-journey.README.md
decisions:
  - "Kept 1-22 numeric step-label prefixes (incl. 13.5.) as genuine ordering; stripped only the (TIR6:16-22) archaeology parenthetical from step 13.5"
  - "Preserved all // reason: blocks + eslint-disable directives; de-cited their phase references where present"
metrics:
  duration: ~18min
  completed: 2026-06-03
---

# Phase 94 Plan 04: De-plan candidate suite + delete redundant README Summary

Mechanical de-archaeologization of the candidate-side E2E layer — 12 candidate fixtures, 2 candidate setup/teardown files, and the candidate-journey + candidate-bank-auth specs — stripping Phase/Plan/D-NN/TIR/SCOPE citations from comments and reformatting the one archaeology-laden step title to plain language, plus deleting the redundant candidate-journey doc-map README (D-04). Functional literals and directive comments preserved; typecheck green.

## What Was Built

### Task 1 — de-plan 12 candidate fixtures + 2 setup files (commit e617fafd6)
- Stripped `Phase 89 Plan 02 (TIR4:… + D-89-02)` `@file` citations and `Phase 88 Plan 04 SCOPE acceptance #6` rigidity-contract citations from all 11 candidate page fixtures + the `candidate-journey.ts` composition root.
- `perm-l10n.ts`: stripped `Phase 90`/`90-RESEARCH`/`90-PATTERNS`/`Plan 90-03/04`/`TIR5:5-13`/`Phase 88 lineage`/`Phase 92 Plan 05 (D-09)` citations; reframed plan-numbered prose ("Plan 90-03 sets…") to the negative/positive spec wording.
- `candidate-journey.setup.ts` + `.teardown.ts`: removed the BEFORE/AFTER change-history narration and `Phase 89 Plan 03 Task 1` / `Phase 93 Plan 04 (D-09/D-11)` rename trail; kept the current-intent contract (idempotent unregister; base owns the `test-` prefix wipe).
- Collapsed wrapped comment prose to single logical lines; preserved every `// reason:` block and `eslint-disable` directive (de-citing `Phase 76 P01` / `Phase 83 DETERM-06` inside two `candidateProfilePage.fixture.ts` comments).

### Task 2 — de-plan + retitle candidate specs, delete README (commit 22b1620c7)
- `candidate-journey.spec.ts`: rewrote the header docstring (removed the `Phase 89 Plan 03` + `TEST-INVENTORY-REFACTOR-4.md lines 101-257` + `TIR4:…`/`R3`/`R13` references); reformatted step-13.5 title from `13.5. profile: invalid URL into Link-type question surfaces invalidUrl error (TIR6:16-22)` → `13.5. profile rejects an invalid URL in a link question with an inline error`; de-cited inline comments (`Plan 89-01 base`, `TIR4:103/178/253-256`, `Phase 91`, `Phase 92 Plan 04 D-10/D-11/D-12`).
- `candidate-bank-auth.spec.ts`: de-cited the `Phase 78 CLEAN-05 IN-01/IN-02` comments + error-message strings and the `73-04 Task 1 Phase B` probe-rewrite comment; titles were already plain language.
- `git rm tests/tests/specs/candidate/candidate-journey.README.md` (D-04).

## Verification

- Task 1 scoped residual grep (`Phase|Plan|D-[0-9]|FLAG-|TIR|baseV1|mega`, carve-outs filtered) across `tests/tests/fixtures/candidate/` + `tests/tests/setup/candidate/` → CLEAN.
- Task 2 scoped residual grep across `tests/tests/specs/candidate/` → CLEAN.
- `git ls-files tests/tests/specs/candidate/candidate-journey.README.md` → empty (file deleted).
- `yarn typecheck:tests` → exit 0 (after Task 1 and after Task 2).

## Deviations from Plan

None — plan executed exactly as written. The 1-22 step-label prefixes were retained per the RESEARCH rule ("strip leading numeric step labels unless they encode genuine ordering the reader needs") since they form a sequential serial walk; only the `(TIR6:16-22)` archaeology parenthetical was stripped from step 13.5.

## Known Stubs

None.

## Threat Flags

None — comment/title edits to candidate E2E fixtures/setup/specs + one redundant README deletion. No production code, no logic change, no package installs.

## Self-Check: PASSED

- All modified/created files present on disk; `candidate-journey.README.md` confirmed deleted.
- Both task commits (e617fafd6, 22b1620c7) found in git history.
