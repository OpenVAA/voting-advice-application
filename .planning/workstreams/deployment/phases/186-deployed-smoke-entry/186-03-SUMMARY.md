---
phase: 186-deployed-smoke-entry
plan: "03"
subsystem: testing
tags: [playwright, deployed-smoke, eslint, vitest, import-lock, service-role]
status: complete

requires:
  - phase: 186-deployed-smoke-entry
    provides: "186-02: tests/playwright.deployed.config.ts, tests/deployed-global-setup.ts, tests/tests/deployed/{voter,contestant}.smoke.ts, smokeContent.ts"
provides:
  - "Root script test:e2e:deployed = playwright test -c ./tests/playwright.deployed.config.ts (the command phase 187 calls)"
  - "tests/eslint.config.mjs: @typescript-eslint/no-restricted-imports on tests/deployed/**, tests/utils/deployedTarget.ts and deployed-global-setup.ts (no service-role client module, dev-seed barrel, Supabase client package or dotenv; type imports allowed)"
  - "tests/tests/utils/deployedSmokeGuards.test.ts: remote-seed token scan over .github/ and the entry, the deployed config's shape, the deployed dir's name rule, and the value-import closure walk"
  - "evidence/186-03-lock.md"
affects: [186-05 controls, 186-06 docs, 186-07 full suite, 186-08 hosted contestant run, 187 pipeline smoke]

actuals:
  tokens: 6060
  tasks: 2
  commits: 4
plan_head_before: 7d94371cb56950c6dc3e61f1c1205b5581c1c356
plan_head_after: d719ae1422dd3770783b7816b7bf325e834b5ad4

tech-stack:
  added: []
  patterns:
    - "A lint rule for direct imports plus a unit walk over the value-import closure for transitive ones, because the lint rule cannot see through a shared fixture"
    - "A guard that scans the whole .github/ tree, so workflows added later inherit it without editing the guard"

key-files:
  created:
    - tests/tests/utils/deployedSmokeGuards.test.ts
    - .planning/workstreams/deployment/phases/186-deployed-smoke-entry/evidence/186-03-lock.md
  modified:
    - package.json
    - tests/eslint.config.mjs

key-decisions:
  - "The import walk fails closed: a relative specifier it cannot resolve counts as a forbidden reach, named as `<chain> → <specifier> (unresolved)`"
  - "The walk strips comments that start a line, or that follow whitespace, before it parses. That way an apostrophe in a comment inside a multi-line import clause cannot hide the import"
  - "Forbidden packages also match their subpaths (`@supabase/supabase-js/…`, `dotenv/config`), which is stricter than the plan's exact names"
  - "RED evidence used vitest's JUnit report, because the classifier rejects vitest's TAP output (an unindented multi-line YAML scalar)"

patterns-established:
  - "Smoke run directories are tests/e2e-runs/186-03-<name>-<UTC stamp>"

requirements-completed: []

coverage:
  - id: D1
    description: "test:e2e:deployed runs the deployed config, passes extra arguments through, and a voter run through it is green on staging"
    requirement: SUPA-09
    verification:
      - kind: e2e
        ref: "yarn test:e2e:deployed tests/tests/deployed/voter.smoke.ts; tests/e2e-runs/186-03-via-script-20261114T230807Z; e2e-spec-verdict --passed voter.smoke.ts --no-flaky"
        status: pass
    human_judgment: false
  - id: D2
    description: "The ESLint lock fails a value import of a service-role client, dotenv or the dev-seed barrel in the smoke files and allows a type import"
    requirement: SUPA-09
    verification:
      - kind: other
        ref: "node_modules/.bin/eslint tests/tests/deployed on a planted file: value 1, type 0, dotenv 1, dev-seed 1, clean 0 (evidence/186-03-lock.md)"
        status: pass
    human_judgment: false
  - id: D3
    description: "yarn test:unit fails on a remote-seed switch in .github/ or the entry, a config-shape change, or a reach to a service-role client by any import path"
    requirement: SUPA-09
    verification:
      - kind: unit
        ref: "tests/tests/utils/deployedSmokeGuards.test.ts (11 cases); yarn test:unit:tests 276 passed; a planted workflow line seen red"
        status: pass
    human_judgment: false

duration: 7min
completed: 2026-11-14
---

# Phase 186 Plan 03: The smoke entry lock Summary

**The deployed smoke entry is now locked three ways. A root script `test:e2e:deployed` ran green on staging. An ESLint rule refuses any value import of a service-role client, the dev-seed barrel, a Supabase client package or `dotenv` in the smoke files. A unit guard scans `.github/` and the entry for the remote-seed switch, pins the config's read-mostly shape, and walks the entry's whole value-import closure.**

## The record

```
LOCK_PLANTED_VALUE_EXIT=1
LOCK_PLANTED_TYPE_EXIT=0
LOCK_PLANTED_DOTENV_EXIT=1
LOCK_PLANTED_DEVSEED_EXIT=1
LOCK_CLEAN_EXIT=0
GUARD_TEST_EXIT=0
GUARD_TEST_CASES=11
VIA_SCRIPT_RUN_DIR=tests/e2e-runs/186-03-via-script-20261114T230807Z
VIA_SCRIPT_EXIT=0
VIA_SCRIPT_VERDICT_EXIT=0
PLANTED_WORKFLOW_EXIT=1
```

Each red lint output contains exactly one problem, `@typescript-eslint/no-restricted-imports`. The staging run passed all four gate lines (`build=712947a1b…`, `ref=cofbsatfrdysyphajsky`). Its result line was `1 passed (7.1s)`, and the verdict line was `VERDICT OK: 1 tests -- passed 1`. Full record: `evidence/186-03-lock.md`.

## Performance

- **Duration:** about 7 min
- **Started:** 2026-11-14T23:07:19Z
- **Completed:** 2026-11-14T23:14Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- `package.json`: one line, `test:e2e:deployed`, placed after `test:e2e:probes`. No other line was changed.
- `tests/eslint.config.mjs`: one appended block that covers `tests/deployed/**/*.ts`, `tests/utils/deployedTarget.ts` and `deployed-global-setup.ts`. It has four `regex` patterns, and every one except `dotenv` sets `allowTypeImports: true`. The `ignores` entry is unchanged.
- `deployedSmokeGuards.test.ts` provides these helpers: `listFiles`, `smokeEntryFiles`, `scanForTokens`, `valueImportSpecifiers`, `resolveRelative`, `walkValueImports`, and `forbiddenReach`, which turns a walk into named chains. The walk over the real entry reaches 27 files, including `contestantLoginPage.fixture.ts`, `packages/dev-seed/src/templates/smoke.ts` and two frontend route modules. It meets only the bare specifiers `@playwright/test`, `path`, `fs` and `url`, and nothing forbidden or unresolved.
- The deployed config is imported under vitest without problems. The shape case reads its default export directly.

## Task Commits

1. **Task 1: root script, ESLint lock seen red and green, staging run through the script** - `491a6476c` (feat)
2. **Task 2 RED: failing guard cases** - `aab26f581` (test)
3. **Fix: lock comment headline joined (comment hygiene)** - `69e52084f` (fix)
4. **Task 2 GREEN: the guard helpers, 11 cases green** - `d719ae142` (feat)

## TDD Gate Compliance

- **RED:** `aab26f581`. 9 of 11 cases failed on their assertions when run against empty helpers. Target: `the token scan > finds the remote-seed switch in each of its spellings, with its line`. It expected `[{ line: 3, token: 'DEV_SEED_ALLOW_REMOTE' }]` and got `[]`. The classifier returned `RED_EVIDENCE_OK` (`target_test_failed`, junit). Semantic assessment: the target ran and failed for the intended reason (an empty `scanForTokens`). There was no load, syntax or fixture fault, and the config-shape case passed in the same run. Record: `tests/e2e-runs/186-03-red-20261114T231108Z/red-junit.json` (ignored).
- **GREEN:** `d719ae142`. 11 of 11 pass.
- **REFACTOR:** none needed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Lock comment broke the comment-hygiene guard**
- **Found during:** Task 2 (verify chain, `node scripts/assert-comment-hygiene.mjs`)
- **Issue:** The headline line of the Task 1 ESLint comment had no terminal punctuation and continued on the next line. The guard calls this a forced line break.
- **Fix:** The headline was joined onto the next comment line, in the same form as the file's other blocks (`// === … === It runs …`).
- **Files modified:** tests/eslint.config.mjs
- **Verification:** `HYGIENE_EXIT=0`. Prettier and lint are clean.
- **Committed in:** `69e52084f`

**2. [Rule 3 - Blocking] RED evidence format**
- **Found during:** Task 2 RED
- **Issue:** The classifier refused vitest's TAP report as malformed, because the reporter writes multi-line expected values without indentation.
- **Fix:** The same RED run was repeated with vitest's JUnit reporter, which the classifier accepts. The test was not changed.
- **Committed in:** no file change (the record is in the ignored run directory)

**3. Additions beyond the plan (no scope change)**
- A planted `.github/workflows/` file was used to see the real scan go red (`PLANTED_WORKFLOW_EXIT=1`). It was then deleted and never staged.
- Forbidden packages also match their subpaths, and the walker strips comments before it parses. Both changes are stricter than the plan.

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking), plus two additions that make the guard stricter.
**Impact on plan:** None on scope. Every prohibition holds: no service-role client is reachable from the entry; the switch appears in no workflow and nowhere in the entry; `ignores`, `test:e2e` and `test:e2e:probes` are unchanged; no planted file was committed.

## Issues Encountered

None beyond the deviations.

## Known Stubs

None.

## Next Phase Readiness

- Phase 187 can call `yarn test:e2e:deployed` and inherits the `.github/` scan through `yarn test:unit`.
- 186-08 runs the contestant spec through the same script. The `error-context.md` threat flag from 186-02 still applies to that run.
- SUPA-09 stays Pending until 186-08.

## Self-Check: PASSED

`tests/tests/utils/deployedSmokeGuards.test.ts`, `evidence/186-03-lock.md` and this file exist. Commits `491a6476c`, `aab26f581`, `69e52084f` and `d719ae142` are ancestors of HEAD. No planted file remains under `tests/tests/deployed/` or `.github/`.
