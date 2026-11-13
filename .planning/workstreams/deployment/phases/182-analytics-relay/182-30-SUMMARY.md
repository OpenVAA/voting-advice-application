---
phase: 182-analytics-relay
plan: 30
subsystem: e2e-evidence-tooling
tags: [e2e, playwright, evidence, verdict, red-control, skipped-baseline]
status: complete

requires:
  - phase: 182-10
    provides: the analytics-privacy spec and opt-in projects whose runs later plans judge with this script
provides:
  - tests/scripts/e2e-spec-verdict.mjs (flags --passed, --passed-test, --failed-test, --failure-contains, --no-other-failures, --no-flaky, --allow-did-not-run, --skipped-baseline, --print-skipped; exit 0/1/2/3)
  - tests/tests/utils/e2eSpecVerdict.test.ts (49 cases, every failing case asserting its exact status)
affects: [182-11, 182-23, 182-24, 182-28, 182-31]

actuals:
  tokens: 8750      # chars/4 over the plan's two code commits' diff (35002 chars)
  tasks: 1
  commits: 2        # git rev-list --count plan_head_before..HEAD at SUMMARY time; the docs commits follow
plan_head_before: 578009db39fef617a0017242514ad9157ec6e86d
plan_head_after: 97329530ce09d4a3a996aaf183f84696e4bda224

tech-stack:
  added: []
  patterns:
    - "A harness script exercised as a process by a vitest case: spawnSync(process.execPath, [script, ...args]) against a results.json written into a fresh temporary directory"
    - "Source-level guards in the unit test: the did-not-run rule line is asserted present, verbatim, in both e2e-evidence.mjs and e2e-spec-verdict.mjs; the script's imports are asserted to be exactly node:fs and node:path"

key-files:
  created:
    - tests/scripts/e2e-spec-verdict.mjs
    - tests/tests/utils/e2eSpecVerdict.test.ts
    - .planning/workstreams/deployment/phases/182-analytics-relay/evidence/30-gates.txt
  modified: []

key-decisions:
  - "A test is named by project › file › full title, where the full title carries the describe titles (suite titles that are not the file's own) joined by ' › '; --passed-test, --failed-test and the skipped-baseline lines all use that full title"
  - "--failure-contains attaches only when it directly follows a --failed-test value or another --failure-contains value; anywhere else it exits 2"
  - "A report with no stats object exits 3 (not a Playwright report); a flag value that is empty or starts with -- exits 2; --skipped-baseline may be given once and an unreadable baseline file exits 2"
  - "Baseline comparison is a sorted multiset comparison over non-blank lines, so the baseline file's order does not matter but duplicates do"
  - "Verdict lines go to standard output, or to standard error under --print-skipped; a relative run-dir or baseline path is read against the repository root, as e2e-evidence.mjs does"

requirements-completed: []

duration: 10min
completed: 2026-10-19
---

# Phase 182 Plan 30: The run-verdict script Summary

`tests/scripts/e2e-spec-verdict.mjs` decides by one exit status whether a Playwright run directory holds the evidence a plan claims. It checks per-spec passes by exact base name, red controls by their error text, the declared-skip set against a baseline, and did-not-run tests with the same rule `e2e-evidence.mjs` uses. Empty or cut-off reports can never pass.

Start sha: `578009db39fef617a0017242514ad9157ec6e86d`.

## What was built

- **The script.** It is plain Node, imports only `node:fs` and `node:path`, and only reads. Two rules run before any flag is looked at. If the `stats` count more tests than the `suites` tree holds (including none), it exits 3, the same as a missing or unparseable `results.json`. A report with no test exits 1 under every flag combination. Each failing condition prints its own `VERDICT FAIL:` line, so one run reports every failure. With no condition flag, the script still fails on any test that did not run.
- **The unit test.** It has 49 cases, one or more per behaviour bullet, and each runs the script as a process against a temporary `results.json`. The required cases are all there: the four zero-test flag combinations (status 1), a declared skip inside a `--passed` spec (1) and its baseline counterpart (0), the cut-off and fewer-than-stats reports (3), a red control that failed with a timeout message (1), `--failure-contains` with no `--failed-test` before it (2), an ending-only base-name match (1), a two-file match (1) and a path separator (2). Two source guards are also included. One requires the `const declarativeSkip = …` line to appear verbatim in both scripts. The other requires the script to import only `node:fs` and `node:path` and to hold no process-start or file-write call.
- **The red test was seen failing.** All 49 cases failed before the script existed, at commit 4a50f3f47.
- **Sanity check against a real run.** On `tests/e2e-runs/181-16-20261016T160424Z.54dc259ada5d/`, the script gave `VERDICT OK: 341 tests`, exit 0, so a real report's stats and tree agree.

## Commits

| Commit | Subject |
|--------|---------|
| 4a50f3f47 | test(182-30): the run-verdict script's cases, failing cases included |
| 97329530c | feat(182-30): the run-verdict script, judging a Playwright report by one exit status |

## Gates (slot 30-gates, attempt 20261019T105140Z.97329530c)

The gates ran on `97329530ce09d4a3a996aaf183f84696e4bda224`. The tree was clean before and after, and HEAD did not move.

- `yarn typecheck:tests`: `TYPECHECK_TESTS_EXIT=0`
- `yarn eslint tests`: `ESLINT_TESTS_EXIT=0`
- `yarn test:unit:tests`: `TEST_UNIT_TESTS_EXIT=0` (10 files, 189 tests)

The record `evidence/30-gates.txt` is a `cp` of the attempt file. The plan's three automated verifies were run and each exited 0: the unit test, the missing-run-dir check returning 3, and the record check.

## Deviations from Plan

**1. [Rule 3 - Blocking] func-style lint fix and Prettier formatting before the GREEN commit**
- **Found during:** Task 1
- **Issue:** The shared ESLint config's `func-style` rule rejects arrow-function constants such as `resolve`, `say`, `fail`, `minus` and `count`. Prettier also wanted to reformat both new files.
- **Fix:** I turned those constants into function declarations and ran Prettier on both files. The test file's formatting-only change went into the GREEN commit.
- **Commit:** 97329530c

The interface and behaviour block left a few points open, so I settled them. Each is recorded in key-decisions: full-title naming, the strict "directly follows" attachment of `--failure-contains`, exit 3 for a report with no stats object, and exit 2 for an empty flag value or a duplicate `--skipped-baseline`.

## Notes for later plans

- Baseline lines have the form `<project> › <spec file as the report records it, relative to testDir> › <describe titles › test title>`. The simplest way to record a baseline is `node tests/scripts/e2e-spec-verdict.mjs <run-dir> --allow-did-not-run --print-skipped > <baseline>`, which puts the lines on stdout and the verdict on stderr.
- `--passed` matches across every project that ran the file, so all of that file's tests in every project must be `expected`.
- `--no-other-failures` exempts every test whose title contains any `--failed-test` value, even when that test failed for a reason other than its `--failure-contains` text. The `--failure-contains` check is what catches a wrong reason.
- `tests/scripts/e2e-run.sh` and `tests/scripts/e2e-evidence.mjs` were not edited.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: tests/scripts/e2e-spec-verdict.mjs
- FOUND: tests/tests/utils/e2eSpecVerdict.test.ts
- FOUND: .planning/workstreams/deployment/phases/182-analytics-relay/evidence/30-gates.txt
- FOUND: 4a50f3f47 and 97329530c in HEAD's history
