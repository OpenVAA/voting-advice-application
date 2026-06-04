---
phase: 94-final-e2e-suite-polish-de-planning-reformat-readme-triage
plan: 06
subsystem: testing
tags: [playwright, e2e, test-utils, helpers, shared-setup, eslint-config, de-planning]

# Dependency graph
requires:
  - phase: 94-01
    provides: shared de-planning sweep rule + gate grep pattern + functional carve-out list
provides:
  - De-planned 6 test utils + 5 helper-source files with current-intent comments only
  - De-planned 3 shared setup files (auth/base setup + base teardown)
  - De-planned 3 root config files (seed-test-data.ts, vitest.config.ts, eslint.config.mjs)
  - seed-test-data.ts throw message de-cited (Phase 93 archaeology dropped, e2e/base literal kept)
affects: [94-final-e2e-suite-polish-de-planning-reformat-readme-triage]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Comments explain current intent only; functional directive comments preserved"
    - "Helper contract rationale de-cited but retained verbatim in substance"

key-files:
  created: []
  modified:
    - tests/tests/utils/candidateJourneyConstants.ts
    - tests/tests/utils/supabaseAdminClient.ts
    - tests/tests/utils/testCredentials.ts
    - tests/tests/utils/testIds.ts
    - tests/tests/utils/voterIntro.ts
    - tests/tests/utils/voterNavigation.ts
    - tests/tests/helpers/db-precondition.helper.ts
    - tests/tests/helpers/navigation.helper.ts
    - tests/tests/helpers/select.helper.ts
    - tests/tests/helpers/settle.helper.ts
    - tests/tests/helpers/timeouts.ts
    - tests/tests/setup/shared/auth.setup.ts
    - tests/tests/setup/shared/base.setup.ts
    - tests/tests/setup/shared/base.teardown.ts
    - tests/seed-test-data.ts
    - tests/vitest.config.ts
    - tests/eslint.config.mjs

key-decisions:
  - "Kept the settleNetworkIdle no-swallow contract, Select combobox+listbox ARIA contract, walkVoterIteration maxSteps, and walkToQuestion resilience rationale — stripped only the phase/RESEARCH-doc citation tails"
  - "Rewrote seed-test-data.ts:23 throw message to drop '— Phase 93 regression?' while preserving the functional 'e2e/base' literal and throw behavior"
  - "Kept eslint.config.mjs no-restricted-locators allow-list rationale + setup/teardown assertion exemption; stripped Phase 73/92 + CONTEXT D-NN citation framing; all eslint-disable directives preserved"
  - "Preserved INFO_QUESTION_ANSWERS test-qu-info-* keys and all testId string literals verbatim"

patterns-established:
  - "Pattern 1: util/helper docstrings carry contract + current intent with zero planning archaeology"
  - "Pattern 2: runtime throw/diagnostic strings de-cited the same as comments when they carry archaeology"

requirements-completed: [DEPLAN-utils, DEPLAN-helpers-src, DEPLAN-shared-setup, DEPLAN-root-config]

# Metrics
duration: ~10min
completed: 2026-06-03
---

# Phase 94 Plan 06: Test Utils + Helpers + Shared Setup + Root Config De-planning Summary

**De-archaeologized the 6 test utils, 5 helper-source files, 3 shared setup files, and 3 root config files (incl. eslint.config.mjs), rewrote the seed-test-data throw message to drop Phase 93 archaeology while keeping the e2e/base literal — typecheck green, scoped residual grep empty.**

## Performance

- **Duration:** ~10 min
- **Tasks:** 2
- **Files modified:** 17
- **Files deleted:** 0

## Accomplishments
- Stripped Phase/Plan/D-NN/TIR/FLAG-/RESEARCH-doc citations from the 6 utils + 5 helper-source files while preserving every helper/util contract rationale
- Stripped phase/plan/decision citations from auth/base setup + base teardown comments
- De-cited eslint.config.mjs while keeping the no-restricted-locators allow-list rationale and the setup/teardown assertion exemption; all eslint-disable + // reason: directives preserved
- Rewrote `seed-test-data.ts:23` throw message: dropped `— Phase 93 regression?`, kept `BUILT_IN_TEMPLATES['e2e/base']` lookup + throw behavior
- Collapsed manually wrapped comment prose to single logical lines throughout

## Task Commits

1. **Task 1: De-plan the 6 utils + 5 helper-source files** - `4b13e2827` (docs)
2. **Task 2: De-plan shared setup + root config (incl. eslint.config.mjs) + fix seed throw message + typecheck** - `d068fdb23` (docs)

## Files Created/Modified
- `tests/tests/utils/*` (6 files) - docstring + inline de-citation; contract rationale + functional literals kept
- `tests/tests/helpers/*.ts` (5 files) - docstring de-citation; settleNetworkIdle no-swallow + Select ARIA + timeout-bucket contracts kept
- `tests/tests/setup/shared/{auth.setup,base.setup,base.teardown}.ts` - phase/plan/decision citations stripped; functional prefixes (`test-e2e-base-`, `e2e-perm-`, `e2e/base`) + `// reason:` blocks preserved
- `tests/seed-test-data.ts` - throw message de-cited; `e2e/base` literal + throw behavior preserved
- `tests/vitest.config.ts` - header de-cited
- `tests/eslint.config.mjs` - rule-rationale kept, citations stripped, directives preserved

## Decisions Made
- Preserved the `voterNavigation.ts` walkToQuestion resilience rationale (the dual-state-return defensive isVisible probe) and the `advanceClick` fast-fail / post-click-settle `// reason:` blocks — only phase/RESEARCH-doc tails were removed.
- Kept the `select.helper.ts` "NOT a radiogroup" combobox+listbox ARIA contract and the `settle.helper.ts` no-swallow asymmetry contract verbatim in substance.
- Kept `INFO_QUESTION_ANSWERS` `test-qu-info-*` map keys and the rationale explaining why they keep that prefix (the `.replace(/^test-/)` label-regex dependency).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## Next Phase Readiness
- Utils + helpers + shared-setup + root-config layer now reads as current-intent source.
- Scoped residual grep empty across `tests/tests/utils/`, `tests/tests/helpers/*.ts`, the 3 shared-setup files, and the 3 root configs (incl. `eslint.config.mjs`); `yarn typecheck:tests` exits 0.
- No blockers for the remaining Phase 94 plans.

## Self-Check: PASSED

- 94-06-SUMMARY.md exists
- All 17 modified files present
- Task commits 4b13e2827 + d068fdb23 present in git log
- seed-test-data.ts throw message contains `'e2e/base'`, no `Phase 93`

---
*Phase: 94-final-e2e-suite-polish-de-planning-reformat-readme-triage*
*Completed: 2026-06-03*
