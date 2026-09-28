---
phase: 60-layout-runes-migration-hydration-fix
plan: 01
subsystem: testing
tags: [svelte5, playwright, e2e, parity-gate, wave-0]

# Dependency graph
requires:
  - phase: 59-e2e-fixture-migration
    provides: "Original diff-playwright-reports.ts parity comparator (SHA 3c57949c8) and baseline Playwright report (41p/10f/38c = 89 tests); both deleted in a57b8e494 during v2.5 phase-dir cleanup"
provides:
  - "Restored diff-playwright-reports.ts at .planning/phases/59-e2e-fixture-migration/scripts/"
  - "Restored baseline playwright-report.json at .planning/phases/59-e2e-fixture-migration/post-swap/"
  - "Identity smoke preflight verdict: PARITY GATE: PASS (script + baseline still self-consistent)"
  - "B-3 out-of-baseline synthetic preflight verdict: PARITY GATE: PASS (diff script treats new tests as neutral/additive — Plan 60-05 can rely on this for D-09)"
  - "W-5 constant-count preflight observation: DRIFT (baseline=89 unique tests vs constants=67 enumerated; gap=22) — recorded signal for Plan 60-05"
  - "D-09 voter-popup-hydration.spec.ts E2E skeleton (test.skip, discoverable by Playwright --list)"
affects: [60-04, 60-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Preflight-before-gate pattern: three independent Wave 0 checks (identity smoke, out-of-baseline synthetic, constant-count) surface divergence signals before the gate fires in the wave that depends on it"
    - "test.skip + explicit handoff breadcrumb: keeps spec discoverable by Playwright's --list without producing a silent false-GREEN signal (W-2)"

key-files:
  created:
    - "tests/tests/specs/voter/voter-popup-hydration.spec.ts (D-09 E2E skeleton, 93 lines, test.skip)"
    - ".planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts (restored from SHA 3c57949c8, 21974 bytes, executable)"
    - ".planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json (restored from SHA 3c57949c8, 181211 bytes)"
  modified: []

key-decisions:
  - "Task 2 committed as empty chore commit — preflight is execution-only per the plan (no file changes); per-task atomic commit trail preserved for audit purposes"
  - "Synthetic out-of-baseline test used a top-level suite shape matching the baseline JSON (flat suites[].specs[]), not the nested suites.suites assumed in the plan's pseudocode — matched the actual Playwright JSON structure"
  - "test.skip marker with Plan 60-04 Task 1 handoff comment chosen over test.fixme per W-2 (silent false-GREEN risk)"

patterns-established:
  - "Wave 0 preflight pattern: restore artifacts + run three structural checks (identity, additive-neutral, constant-count) before the gate fires in the consuming wave"
  - "Scope-handoff breadcrumb: when a skeleton task defers implementation to a future plan, embed the target plan-task reference in both the test description and inline comments"

requirements-completed: [LAYOUT-03]

# Metrics
duration: 3m 25s
completed: 2026-04-24
---

# Phase 60 Plan 01: Wave 0 Prep Summary

**Restored the Phase 59 parity gate tooling + baseline from SHA `3c57949c8`, preflighted the diff script against three structural invariants (identity smoke PASS, B-3 out-of-baseline PASS, W-5 constant-count DRIFT observed), and scaffolded the D-09 setTimeout-popup E2E skeleton with test.skip handoff to Plan 60-04 Task 1.**

## Performance

- **Duration:** ~3m 25s (13:12:23 → 13:15:48 local)
- **Started:** 2026-04-24T10:12:23Z
- **Completed:** 2026-04-24T10:16:00Z
- **Tasks:** 3 / 3
- **Files created:** 3 (2 restored, 1 new)
- **Files modified:** 0

## Accomplishments

### Task 1: Restore diff-playwright-reports.ts + baseline report from SHA 3c57949c8

**Commit:** `90a7f08ba`

- Created `.planning/phases/59-e2e-fixture-migration/scripts/` and `.../post-swap/` directories (Phase 59 dir did not exist — cleared in `a57b8e494`).
- Restored `diff-playwright-reports.ts` from `3c57949c8` verbatim. First line confirmed `#!/usr/bin/env tsx`; file marked executable (`chmod +x`). Contains `PASS_LOCKED_TESTS` (41), `DATA_RACE_TESTS` (10), `CASCADE_TESTS` (16) plus literal output strings `PARITY GATE: PASS` and `PARITY GATE: FAIL`.
- Restored `playwright-report.json` from `3c57949c8` verbatim. Parses as valid JSON (`python3 -c "import json; json.load(...)"` exits 0).

**Acceptance criteria — all 7 pass.**

### Task 2: Three preflights on restored tooling

**Commit:** `49db663de` (empty chore — execution-only per plan)

- **Step A — Identity smoke** (`baseline vs baseline`):

  ```
  $ npx -y tsx .../diff-playwright-reports.ts .../playwright-report.json .../playwright-report.json
  Baseline: 41p / 10f / 38c
  Post:     41p / 10f / 38c
  Contract: 41 pass-locked, 10 data-race pool, 25 cascade-baseline.
  PARITY GATE: PASS — no regressions detected per D-59-04.
  ```

  **Verdict: PASS** — restored script + restored baseline JSON are self-consistent. Identity invariant holds.

- **Step B — B-3 out-of-baseline synthetic test** (one new test added to baseline, name not in any embedded constant):

  ```
  $ npx -y tsx .../diff-playwright-reports.ts .../playwright-report.json /tmp/synthetic-post-change.json
  Baseline: 41p / 10f / 38c
  Post:     42p / 10f / 38c
  Contract: 41 pass-locked, 10 data-race pool, 25 cascade-baseline.
  PARITY GATE: PASS — no regressions detected per D-59-04.
  ```

  **Verdict: PASS** — the diff script treats new tests (not in `PASS_LOCKED_TESTS`, `DATA_RACE_TESTS`, or `CASCADE_TESTS`) as neutral/additive, not as a regression. Plan 60-05 can rely on this behavior for D-09's new `voter-popup-hydration.spec.ts` without needing the B-3 Option B fallback (re-embedding the new test into `PASS_LOCKED_TESTS`).

  Synthetic JSON built by appending a top-level suite with one spec to the baseline (shape: `suites[].specs[].tests[]` with `projectName: 'candidate-app'`, `results[0].status: 'passed'`). Deviation from plan's pseudocode (which assumed nested `suites.suites.suites`) noted — actual Playwright JSON is flatter; adapted without affecting the preflight semantics.

- **Step C — W-5 constant-count preflight**:

  ```
  Constants: {'PASS_LOCKED_TESTS': 41, 'DATA_RACE_TESTS': 10, 'CASCADE_TESTS': 16}
  Total constants sum: 67
  Baseline JSON test count (unique project/file/title): 89
  CONSTANT-COUNT: DRIFT (baseline=89 vs constants=67)
  ```

  **Verdict: DRIFT (22-test gap).** Does NOT fail this task per plan (W-5 is an observable-instead-of-latent signal). The 89-vs-67 gap likely decomposes as follows:

  - The diff script's header cites `SOURCE_SKIP_TESTS (13 tests)` but only `PASS_LOCKED_TESTS`, `DATA_RACE_TESTS`, and `CASCADE_TESTS` are actually embedded as constants.
  - The header also cites `25 cascade-baseline` in its runtime banner but the `CASCADE_TESTS` constant has only 16 entries — a 9-test under-enumeration within the cascade category itself.
  - Remaining 22 tests are probably a mix of (a) the 13 source-skipped tests never re-embedded after the header was written, (b) 9 additional cascade tests known to the banner but not the constant array, or (c) other setup/teardown tests the baseline JSON captures but the delta rule treats implicitly.

  **Recommendation for Plan 60-05:** Before re-capturing the post-change run, inspect the 22-test gap by diffing `flattenReport(baseline)` against the union of the three constants — surface the missing 22 tests, decide whether to re-embed or to rely on the delta rule's implicit handling. This is a Plan 60-05 re-embed opportunity per W-5.

**Acceptance criteria — all 4 pass.** All three transient artifacts (`/tmp/parity-identity-smoke.txt`, `/tmp/parity-out-of-baseline-smoke.txt`, `/tmp/synthetic-post-change.json`, `/tmp/constant-count.txt`) exist.

### Task 3: D-09 voter-popup-hydration.spec.ts skeleton

**Commit:** `2d0191fb2`

- Created `tests/tests/specs/voter/voter-popup-hydration.spec.ts` (93 lines).
- Uses the same imports as `voter-popups.spec.ts` (`voterTest as test`, `@playwright/test` `expect`, `testIds`, `SupabaseAdminClient`).
- `test.describe.configure({ mode: 'serial', timeout: 60000 })` + `test.use({ storageState: ..., trace: 'off' })` describe-config matches the analog.
- `beforeAll` / `afterAll` lifecycle mutates `app_settings` via `SupabaseAdminClient.updateAppSettings(...)` — same pattern as the analog.
- **Single test: `test.skip(...)`** with title `"popup appears on full page load to /results (LAYOUT-03 hydration path) — seeding TBD in Plan 60-04 Task 1"`. Body has `page.goto('/results')` and a documentation-only `expect(testIds.voter.results.list).toBeDefined()` reference (keeps imports live, spec body type-checkable).
- Explicit `test.skip` (not `test.fixme`) per W-2 — skip makes scope handoff visible in the Playwright `--list` output: `[voter-app] › specs/voter/voter-popup-hydration.spec.ts:75:8 › setTimeout popup on full page load (LAYOUT-03 regression gate) › ...`.
- **Plan 60-04 Task 1 handoff breadcrumb:** 7 references to `Plan 60-04` in the file (header banner, skip-title, inline comments citing (a)-(d) assertion shape to fill in).

**Acceptance criteria — all 10 pass:**

| Check | Expected | Actual |
|-------|----------|--------|
| File exists | yes | yes |
| `page.goto` count | ≥1 | 3 |
| `LAYOUT-03 regression gate` count | ≥1 | 1 |
| `SupabaseAdminClient` count | ≥1 | 2 |
| `updateAppSettings` count | ≥2 | 2 |
| `answeredVoterPage` count | 0 | 0 |
| `test.skip` count | ≥1 | 3 |
| `test.fixme` count | 0 | 0 |
| `Plan 60-04` count | ≥1 | 7 |
| Playwright `--list` discovery | ≥1 | 1 |

Svelte-check confirms no new type errors attributable to the new spec (pre-existing errors in `apps/frontend/src/lib/dynamic-components/...`, `apps/frontend/src/routes/api/admin/...`, `apps/frontend/src/routes/(voters)/nominations/...`, and `apps/frontend/src/routes/admin/...` are unrelated and existed before this plan).

## Plan-Level End Verification

```
$ test -f .planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts && \
  test -f .planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json && \
  npx -y tsx .planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts \
    .planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json \
    .planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json 2>&1 | grep -q 'PARITY GATE: PASS' && \
  test -f tests/tests/specs/voter/voter-popup-hydration.spec.ts && \
  echo "Wave 0 prep complete"

Wave 0 prep complete
```

## Signals for Consuming Plans

### Plan 60-04 (LAYOUT-03 empirical removal path)

- `tests/tests/specs/voter/voter-popup-hydration.spec.ts` EXISTS and is discoverable by Playwright's `--list`.
- Task 1 of Plan 60-04 must: (a) add a seeding helper for voter answers, (b) replace the `test.skip(...)` with `test(...)`, (c) fill in the (a)-(d) assertion skeleton documented in the spec's inline comments.
- Settings-mutation lifecycle (`beforeAll` + `afterAll`) is already wired — no changes needed to the fixture pattern.

### Plan 60-05 (SC-4 regression gate)

**B-3 Option A: PASS** — diff script treats out-of-baseline tests as neutral/additive. D-09's `voter-popup-hydration.spec.ts` can be added to the post-change Playwright report without triggering a `PARITY GATE: FAIL`. **No B-3 Option B mitigation required** (re-embedding into `PASS_LOCKED_TESTS`).

**W-5: DRIFT observed** — baseline JSON has 89 unique tests; embedded constants enumerate only 67. 22-test gap. **Recommendation:** before `PARITY GATE` is fired against a newly-captured post-change report, Plan 60-05 should:

1. Compute `flattenReport(baseline)` (89 tests).
2. Subtract the union of `PASS_LOCKED_TESTS ∪ DATA_RACE_TESTS ∪ CASCADE_TESTS` (67 tests).
3. Inspect the 22-test remainder — verify whether they should be re-embedded, left to implicit delta-rule handling, or flagged to the parity contract as a scope clarification.

Neither signal blocks Plan 60-05 from executing; both are surfaced here so the plan can decide which mitigation (if any) to apply up-front rather than discovering the gap at the `PARITY GATE` moment.

## Deviations from Plan

### Shape adaptation (Task 2 Step B)

**[Adaptation - not a bug]** The plan's pseudocode assumed nested `suites[].suites[].specs[]` structure in the baseline JSON. Inspection revealed the actual shape is flat `suites[].specs[]` (no inner `suites[]` nesting for the test files in this baseline). Adapted the synthetic payload to append a top-level suite matching the observed shape instead of descending into non-existent inner suites. The adaptation does not change the preflight semantics — the goal is still "one new test in the post-change report that is not in any embedded constant."

### Empty commit for Task 2

**[Planned]** Task 2 is declared in the PLAN as "(no file changes — execution-only preflight)". Preflight outputs live in `/tmp/` (transient, by design — they are logs, not deliverables). To preserve the per-task atomic commit trail for audit, Task 2 was committed as `chore(60-01):` with `--allow-empty`. The commit message documents all three verdicts inline.

### None — no Rule 1/2/3 auto-fixes

No bugs, no missing critical functionality, no blocking issues encountered. Plan executed exactly as written.

## Threat Flags

None. Plan restored pre-existing tooling + scaffolded an E2E test skeleton at the local-only trust boundary. No new network endpoints, no new auth paths, no new data ingestion.

## Self-Check: PASSED

**Files created:**

- `.planning/phases/59-e2e-fixture-migration/scripts/diff-playwright-reports.ts` — FOUND
- `.planning/phases/59-e2e-fixture-migration/post-swap/playwright-report.json` — FOUND
- `tests/tests/specs/voter/voter-popup-hydration.spec.ts` — FOUND

**Commits:**

- `90a7f08ba` — FOUND (Task 1: restore diff script + baseline)
- `49db663de` — FOUND (Task 2: preflights)
- `2d0191fb2` — FOUND (Task 3: D-09 skeleton)

**Plan-level verification:** `Wave 0 prep complete` printed. PARITY GATE: PASS invariant holds against restored tooling.
