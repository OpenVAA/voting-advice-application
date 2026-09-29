---
phase: 94-final-e2e-suite-polish-de-planning-reformat-readme-triage
plan: 01
subsystem: testing
tags: [playwright, dev-seed, e2e, teardown-guard, de-planning]

# Dependency graph
requires:
  - phase: 93-clean-up-and-reorganise-e2e-tests
    provides: e2e/base canonical template, perm-* project chain, setupFromTemplate teardown-prefix plumbing
provides:
  - WR-01 always-green husk test deleted
  - D-02 retired diff-playwright-reports.ts tool deleted + dereferenced
  - WR-03 fail-loud empty-prefix teardown guard scoped to e2e/base
  - WR-04 data-driven median ordinal default in buildMinimal
  - WR-02 perm-per-app-notifications re-enable TODO marker (D-03 — projects kept)
  - playwright.config.ts + setupFromTemplate.ts de-planned
  - pinned playwright --list baseline (84 tests / 72 files) for Wave 2 sweeps
affects: [94-02, 94-03, 94-07, 94-08, wave-2-de-planning-sweeps]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Fail-loud teardown-prefix guard: only e2e/base maps onto test-e2e-base-; any other empty-prefix template throws"
    - "Data-driven median ordinal default: choices[Math.floor((len-1)/2)].id with '3' fallback"

key-files:
  created:
    - .planning/phases/94-final-e2e-suite-polish-de-planning-reformat-readme-triage/94-PLAYWRIGHT-LIST-BASELINE.txt
  modified:
    - tests/playwright.config.ts
    - tests/tests/setup/shared/setupFromTemplate.ts
    - packages/dev-seed/src/templates/_helpers/buildMinimal.ts
    - .gitignore

key-decisions:
  - "D-03 honored: perm-per-app-notifications projects/spec/setup/teardown/template all kept; only a re-enable TODO added; no dependency rewiring"
  - "D-02 honored: diff-playwright-reports.ts deleted via git rm; only non-.planning reference (the .gitignore comment) removed; tests/README.md link left for Plan 94-08"
  - "buildMinimal docstring de-planning deferred to Plan 94-07 (this plan does the LOGIC change only)"

patterns-established:
  - "WR-03: three-branch teardownPrefix (>=2 chars | e2e/base literal | IIFE-throw)"
  - "WR-04: ordinal default mirrors the existing categorical choice-based branch"

requirements-completed: [WR-01, WR-02, WR-03, WR-04, D-02]

# Metrics
duration: ~12min
completed: 2026-06-03
---

# Phase 94 Plan 01: Code-review follow-ups + retired-tool deletion + infra de-planning Summary

**WR-01..04 + D-02 landed: husk + diff tool deleted, fail-loud empty-prefix teardown guard, data-driven median ordinal default, perm-per-app-notifications re-enable TODO; two infra files de-planned; playwright --list baseline pinned at 84/72.**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-06-03T20:30Z
- **Completed:** 2026-06-03T20:42Z
- **Tasks:** 3
- **Files modified:** 4 (+1 created, 2 deleted)

## Accomplishments
- Deleted the WR-01 always-green `variant-app-settings.test.ts` husk and the D-02 retired `diff-playwright-reports.ts` tool; removed the only non-`.planning/` reference (the `.gitignore` comment).
- WR-03: `setupFromTemplate` teardown-prefix fallback now maps ONLY `e2e/base` onto `test-e2e-base-` and throws loudly for any other empty-prefix template (closes the silent cross-dataset-wipe foot-gun).
- WR-04: `buildMinimal` ordinal default is now data-driven (`choices[Math.floor((choices.length - 1) / 2)].id`), preserving Likert-5 → id `'3'` (index 2), with `'3'` fallback only when choices are absent.
- WR-02 (D-03): added one inline `re-enable perm-per-app-notifications` TODO referencing the Svelte 5 runes migration; no projects removed, no dependencies rewired.
- De-planned `playwright.config.ts` and `setupFromTemplate.ts`: stripped phase/plan/decision citations + change-history narration; preserved functional literals (`e2e/base`, `test-e2e-base-`, `e2e-perm-*`, `test-perm-*`, project names), `// reason:` rationale, and the new WR-02 TODO.
- Pinned the post-WR-02 `playwright test --list` baseline at 84 tests / 72 files (unchanged per D-03) as the Wave 2 "no dropped specs" gate.

## Task Commits

1. **Task 1: WR-01 + D-02 deletions and dereferencing** - `10a580307` (chore)
2. **Task 2: WR-03 guard + WR-04 data-driven ordinal + WR-02 TODO + de-plan infra** - `eeaac374a` (fix)
3. **Task 3: pin playwright --list baseline** - `f209253d7` (docs)

## Files Created/Modified
- `tests/playwright.config.ts` - WR-02 re-enable TODO added; full archaeology de-planning (headers, FLAG-6/TIR/D-NN citations, change-history narration) with functional literals + `// reason:` block preserved.
- `tests/tests/setup/shared/setupFromTemplate.ts` - WR-03 three-branch fail-loud teardown guard; module docstring + inline comments de-planned; `// reason:` rationale kept.
- `packages/dev-seed/src/templates/_helpers/buildMinimal.ts` - WR-04 data-driven median ordinal default (logic only; docstring de-planning left for Plan 94-07).
- `.gitignore` - removed the diff-tool reference comment; general artifact ignores kept.
- `packages/dev-seed/tests/templates/variant-app-settings.test.ts` - DELETED (WR-01).
- `tests/scripts/diff-playwright-reports.ts` - DELETED (D-02).
- `.planning/phases/94-.../94-PLAYWRIGHT-LIST-BASELINE.txt` - CREATED (Wave 0 gate).

## Decisions Made
- None beyond honoring the LOCKED CONTEXT decisions (D-02 delete, D-03 keep-with-TODO). buildMinimal docstring de-planning deferred to Plan 94-07 per the plan's critical reminders.

## Deviations from Plan

None - plan executed exactly as written.

A `TIR` substring false-positive in the word "ENTIRE" surfaced during the de-planning grep on `playwright.config.ts`; reworded the comment to "whole" (in-scope de-planning, not a deviation).

## Issues Encountered
- The Task 2 gate grep initially flagged a comment line because the gate token `TIR` matched the substring inside "ENTIRE". Resolved by rewording the comment; no functional change.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- The two infra files this plan owns (`playwright.config.ts`, `setupFromTemplate.ts`) are de-planned, so Wave 2 sweeps will not touch shared logic.
- Baseline pinned at 84/72 — the binding "no dropped specs" gate for Wave 2.
- Full `yarn test:e2e` green gate not run this plan (requires running stack); typecheck + dev-seed unit + `--list` all green. The base/perm chains have no behavior change (only `e2e/base` is the current empty-prefix template, so the WR-03 throw branch is never hit at runtime).

## Self-Check: PASSED

- 94-01-SUMMARY.md exists
- 94-PLAYWRIGHT-LIST-BASELINE.txt exists
- variant-app-settings.test.ts absent from git ls-files
- diff-playwright-reports.ts absent from git ls-files
- Commits 10a580307, eeaac374a, f209253d7 all present

---
*Phase: 94-final-e2e-suite-polish-de-planning-reformat-readme-triage*
*Completed: 2026-06-03*
