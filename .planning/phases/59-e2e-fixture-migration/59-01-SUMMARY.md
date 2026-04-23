---
phase: 59-e2e-fixture-migration
plan: 01
subsystem: e2e-testing-baseline
tags: [playwright, baseline, parity-contract, e2e, phase-59]
dependency_graph:
  requires:
    - "Dev stack running (Supabase :54321 + Vite :5173)"
    - "Chromium headless shell (playwright install chromium)"
  provides:
    - ".planning/phases/59-e2e-fixture-migration/baseline/wait-for-healthy.sh (health-check helper)"
    - ".planning/phases/59-e2e-fixture-migration/baseline/playwright-report.json (raw pre-swap JSON — 89 tests)"
    - ".planning/phases/59-e2e-fixture-migration/baseline/summary.md (parity contract with 41/10/25/13 split)"
  affects:
    - "Plan 59-05 (post-swap parity diff consumes all three artifacts)"
    - "Plan 59-03 (diff script allowlist uses the data-race test names)"
tech_stack:
  added: []
  patterns:
    - "committed baseline artifact for permanent parity reference (D-59-02 — beats CI 90-day artifact retention)"
    - "dotenv banner suppression via DOTENV_CONFIG_QUIET=true env var (keeps stdout JSON clean)"
    - "shell-based health-check loop with per-endpoint failure-reason emission"
key_files:
  created:
    - ".planning/phases/59-e2e-fixture-migration/baseline/wait-for-healthy.sh"
    - ".planning/phases/59-e2e-fixture-migration/baseline/playwright-report.json"
    - ".planning/phases/59-e2e-fixture-migration/baseline/summary.md"
  modified: []
decisions:
  - "Dropped `list` reporter from D-59-03's `--reporter=json,list` because both write to stdout and corrupt the JSON stream. Only `json` is required by the parity contract; list was human-readability extra."
  - "Added `DOTENV_CONFIG_QUIET=true` to the invocation to suppress dotenv@17.3.1's 'injecting env' banner line that polluted the JSON output. Not in D-59-03 literally but permitted under §Claude's Discretion."
  - "Ran `yarn playwright install chromium` as a Rule 3 prerequisite fix — the first run failed in 16s with `browserType.launch: Executable doesn't exist`. Browser install is a one-time local machine prerequisite, not a code change."
  - "Reported ACTUAL 41/10/25/13 split over CONTEXT.md's v2.4 15/19/55 expectation. The total (89) matches; distribution improved. Plan 05's parity gate uses the actual test names, not the stale counts."
metrics:
  duration_seconds: 651
  total_tasks: 4
  completed_tasks: 4
  completed_date: 2026-04-23
  commits:
    - "398fc8de4: chore(59-01) wait-for-healthy.sh"
    - "0e58dc4c3: docs(59-01) baseline capture"
---

# Phase 59 Plan 01: Baseline Playwright Capture Summary

Committed a permanent pre-swap Playwright baseline (89 tests: 41 pass / 10 data-race fail / 25 cascade / 13 source-level test.skip) plus a deterministic health-check helper; encodes the parity contract Plan 05's post-swap diff must satisfy (D-59-04).

## Objective

Capture the pre-swap Playwright baseline per D-59-01/D-59-02/D-59-03 and lock it in as the parity contract Plan 05's post-swap run must satisfy (D-59-04). E2E-03 requires a deterministic, committed baseline that survives CI's 90-day artifact retention; the three files under `baseline/` are that permanent reference.

## What Was Built

Three files under `.planning/phases/59-e2e-fixture-migration/baseline/`:

1. **`wait-for-healthy.sh`** (53 lines, executable, 0o755). Polls `curl -sSf http://127.0.0.1:54321/auth/v1/health` + `curl -sSfI http://localhost:5173/` every 1s for up to 120s, exits 0 on both-live or exits 1 naming the specific unreachable endpoint. Zero dependencies beyond `curl` + `bash`. Matches the D-59-03 retry-loop discretion and will be re-used by Plan 05's post-swap capture.

2. **`playwright-report.json`** (181 KB, 4559 lines). Raw Playwright JSON reporter output from:
   ```
   DOTENV_CONFIG_QUIET=true yarn playwright test \
     -c ./tests/playwright.config.ts ./tests \
     --reporter=json --workers=1
   ```
   run against branch `feat-gsd-roadmap` at baseline commit `f09daea3498fef8fa62c430a6cd5a19535af8e5c`. 178 seconds wall time. 89 tests total. Contains per-test `status`, `expectedStatus`, `results[].error.message`, and project/file/title references — sufficient for Plan 05's delta script to compute set-difference.

3. **`summary.md`** (248 lines). Hand-authored summary with frontmatter + 6 required sections (`Passing Tests`, `Data-race Failing Tests`, `Cascade / did-not-run Failing Tests`, `Deltas from CONTEXT.md`, `Baseline metadata`, `References`) + additional `Test.skip` and `Secret-leak sanity check` sections. Enumerates the 41 passing test names, 10 data-race fails, 25 cascades, and 13 explicit `test.skip` markers with root-cause breakdowns.

## Actual 41/10/25/13 split vs CONTEXT.md's 15/19/55 expectation

**Total (89) matches exactly** — no specs added or removed. Distribution improved substantially since the v2.4 tally was taken:

| Bucket | CONTEXT.md (v2.4) | Actual (today) | Delta |
|--------|-------------------|----------------|-------|
| Pass | 15 | 41 | +26 |
| Data-race fail | 19 | 10 | −9 |
| Cascade (did-not-run) | 55 | 25 | −30 |
| Explicit test.skip | — (folded into cascade in v2.4 tally) | 13 | — |

**Interpretation:** v2.4-and-later stabilization work (Phases 56-58) pulled tests out of the cascade pool by fixing upstream data-setup failures. The remaining 10 data-race fails are all `voter-app` / `voter-app-settings` tests hitting the Svelte 5 `pushState` reactivity bug on the journey -> questions handoff (timeout on `question-choice`, `voter-questions-start`, `voter-questions-category-list` selectors). These are deferred to the "Svelte 5 Migration Cleanup" milestone per D-59-13 and are explicitly out of Phase 59's scope.

**Implication for D-59-04:** Plan 05's parity diff script MUST use the actual 41/10/25/13 test-name lists from this summary, not CONTEXT.md's v2.4 15/19/55 name lists. The counts are advisory; the test names are the contract.

## Tasks Executed

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Developer starts Supabase + dev server | (no commit — human-action checkpoint) | COMPLETE before this session |
| 2 | Author wait-for-healthy.sh | `398fc8de4` | COMPLETE |
| 3 | Capture Playwright baseline JSON | (staged, combined into Task 4 commit) | COMPLETE |
| 4 | Author baseline/summary.md + commit | `0e58dc4c3` | COMPLETE |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking prerequisite] Playwright chromium headless shell not installed**
- **Found during:** Task 3 first attempt (18s, exit 1, 16 `browserType.launch: Executable doesn't exist` errors)
- **Issue:** `/Users/kallejarvenpaa/Library/Caches/ms-playwright/chromium_headless_shell-1208/` did not exist — browsers were never installed locally on this machine.
- **Fix:** Ran `yarn playwright install chromium` (one-time download of Chrome for Testing 145.0.7632.6 + chrome-headless-shell, ~253 MiB total) — local-machine prerequisite, no code change.
- **Files modified:** None (browser binaries live in `~/Library/Caches/`, outside the repo).
- **Commit:** N/A

**2. [Claude's Discretion — D-59-03 §Claude's Discretion allowed] Dropped `list` reporter, added `DOTENV_CONFIG_QUIET=true`**
- **Found during:** Task 3 first attempt with `--reporter=json,list`; the JSON stream was prefixed with dotenv@17.3.1's `[dotenv@17.3.1] injecting env (25) from .env ...` banner, breaking `jq` parsing.
- **Issue:** Per D-59-03's verbatim `yarn test:e2e --reporter=json,list --workers=1`, both reporters write to stdout — the list reporter's human-readable progress intersperses with the JSON document, corrupting it. Additionally, dotenv@17.3.1 writes an "injecting env" banner to stdout (not stderr) on `.config()` call.
- **Fix:** Dropped `list`, kept only `--reporter=json`. Set `DOTENV_CONFIG_QUIET=true` env var (supported by dotenv 17+). Documented the adjustment in `summary.md` under §Invocation.
- **Files modified:** `baseline/summary.md` (the documentation of the invocation).
- **Commit:** `0e58dc4c3`

### Scope Deviation

None. All three files exist at the paths specified by the plan; all acceptance criteria pass.

## Authentication Gates

None during Plan execution. Task 1 (human-action checkpoint) was completed by the developer before this agent resumed; the dev stack (Supabase + Vite) was running when the agent started.

## Verification

All acceptance criteria passed:

- **Task 2:** `wait-for-healthy.sh` exists, executable (`-rwxr-xr-x`), passes `bash wait-for-healthy.sh --timeout-seconds 30` against live services, contains `127.0.0.1:54321` (2 matches) and `localhost:5173` (2 matches).
- **Task 3:** `playwright-report.json` is 181 KB, `jq '.suites | length'` returns 25 (top-level file-suites), `jq '.stats'` returns `{duration: 178021, expected: 41, skipped: 38, unexpected: 10}` — 89 tests total, valid JSON (no dotenv banner prefix).
- **Task 4:** `summary.md` contains all 6 required headings verbatim (`# Phase 59 Baseline`, `## Passing Tests`, `## Data-race Failing Tests`, `## Cascade / did-not-run Failing Tests`, `## Deltas from CONTEXT.md`, `## References`); the 40-char baseline SHA `f09daea3498fef8fa62c430a6cd5a19535af8e5c` appears after "Baseline commit:" and `git cat-file -t` resolves it as `commit`; `git log -1 --format=%s` returns `docs(59-01): capture Phase 59 baseline Playwright report`.
- **Threat T-59-01-01:** grep against `playwright-report.json` for `SERVICE_ROLE_KEY|Bearer ey|"password":|SUPABASE_SERVICE_ROLE` returns zero matches — no secret leakage.
- **Deletion guard:** `git diff --diff-filter=D --name-only HEAD~2 HEAD` returns empty — commits are purely additive.

## Success Criteria (from Plan)

The baseline artifact set permanently encodes the parity contract for E2E-03 per D-59-04:

- [x] Plan 05's diff script now has `summary.md` with the 10-item data-race allowlist, the 41-item pass set, and the 25-item cascade set — all as explicit test name strings, sorted deterministically for stable diffs.
- [x] `playwright-report.json` is the pass/fail source of truth with per-test `status`, `expectedStatus`, and error messages.
- [x] `wait-for-healthy.sh` is re-usable by Plan 05's post-swap capture — same default ports, same exit semantics.

## References

- Plan: `.planning/phases/59-e2e-fixture-migration/59-01-PLAN.md`
- Phase context: `.planning/phases/59-e2e-fixture-migration/59-CONTEXT.md` (D-59-01/02/03/04/13)
- Phase patterns: `.planning/phases/59-e2e-fixture-migration/59-PATTERNS.md`
- Baseline artifact set: `.planning/phases/59-e2e-fixture-migration/baseline/{wait-for-healthy.sh, playwright-report.json, summary.md}`

## Self-Check: PASSED

**Files verified to exist:**
- `.planning/phases/59-e2e-fixture-migration/baseline/wait-for-healthy.sh` — FOUND
- `.planning/phases/59-e2e-fixture-migration/baseline/playwright-report.json` — FOUND
- `.planning/phases/59-e2e-fixture-migration/baseline/summary.md` — FOUND
- `.planning/phases/59-e2e-fixture-migration/59-01-SUMMARY.md` — FOUND (this file)

**Commits verified to exist:**
- `398fc8de4` — FOUND (wait-for-healthy.sh)
- `0e58dc4c3` — FOUND (baseline capture: summary.md + playwright-report.json)

No missing items. Plan 59-01 artifacts are all present and their commits resolve via `git log`.
