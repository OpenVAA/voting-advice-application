---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
plan: "20"
subsystem: analytics
tags: [analytics, queue, vitest, environment-templates]
status: complete

requires:
  - phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
    provides: "188-01: ANALYTICS_FLUSH_INTERVAL_MS resolved and passed to createQueue, and the commented .env.example line"
provides:
  - "createQueue's in-flight guard: a timer tick returns at once while the timer's previous flush runs, so a hung provider sees one capture per hang and the events held stay within the cap plus one taken batch (2 x cap)"
  - "the shutdown flush still runs during a hung timer flush (it calls flush directly, never through the guard)"
  - "ANALYTICS_FLUSH_INTERVAL_MS in render.example.yaml (a - key: entry, value '2000') and docker-compose.dev.yml (default 2000)"
  - "the dev-seed template test lists six analytics variables, and its header says six"
affects: [188-12, 188-13]

actuals:
  tokens: 2437
  tasks: 2
  commits: 4
plan_head_before: b0d231b5417e00d21d6a47044ec6b2e12adedc14
plan_head_after: ec392493fc87aeca0b7c0db3ef77dab1af7171d6

tech-stack:
  added: []
  patterns:
    - "A hanging stand-in provider whose capture promises resolve only when the test releases them, oldest first, with a held() count of the events in unresolved captures"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/server/analytics/queue.ts
    - apps/frontend/src/lib/server/analytics/queue.test.ts
    - packages/dev-seed/tests/analyticsEnvTemplates.test.ts
    - render.example.yaml
    - docker-compose.dev.yml

key-decisions:
  - "The guard covers the timer only: flush() and registerShutdownFlush are unchanged, so a direct flush is neither skipped nor made to wait for a timer flush in flight"
  - "The Render entry's inline comment states the accepted range (500 to 600000 ms), matching the .env.example line"

patterns-established:
  - "Every analytics variable the server reads appears in all three environment templates; the dev-seed template test enforces it per name"

requirements-addressed: [RELAY-04, RELAY-09]
requirements-completed: []

metrics:
  duration: "about 15 min"
  completed: 2026-11-18
---

# Phase 188 Plan 20: The queue's in-flight guard and the flush interval in every template Summary

The queue's timer now skips a tick while its own flush is still running. A hung provider gets one `capture` per hang, and the queue holds at most its cap plus one taken batch. The shutdown flush still runs during the hang. `render.example.yaml` and `docker-compose.dev.yml` now name `ANALYTICS_FLUSH_INTERVAL_MS` with the default 2000.

## New test cases

- `apps/frontend/src/lib/server/analytics/queue.test.ts`
  - `createQueue > skips a tick while its flush is in flight, so a hanging provider sees one capture per hang`
  - `createQueue > holds at most the cap in the queue plus one taken batch while the provider hangs`
  - `registerShutdownFlush > still flushes at shutdown while a timer flush hangs`
- `packages/dev-seed/tests/analyticsEnvTemplates.test.ts` (new `it.each` rows from the sixth name)
  - `.env.example > names ANALYTICS_FLUSH_INTERVAL_MS` (passed already at RED: 188-01 added the line)
  - `render.example.yaml > declares - key: ANALYTICS_FLUSH_INTERVAL_MS`
  - `docker-compose.dev.yml > passes ANALYTICS_FLUSH_INTERVAL_MS through with a default`

## Performance

- Duration: about 15 min, including a 1.5 min targeted E2E run
- Tasks: 2 of 2
- Files modified: 5

## Task Commits

1. Task 1, a timer tick is skipped while a flush is in flight (tracer, TDD)
   - RED `8d9de1f49`: `test(188-20)`. 2 of 14 failed: `expected "vi.fn()" to be called 1 times, but got 5 times`, and `expected 50 to be less than or equal to 10`. The shutdown case passed at RED because shutdown already called `flush()` directly. It guards that this stays true.
   - GREEN `a59757d5e`: `feat(188-20)`. 14 of 14 passed.
2. Task 2, the two other templates name the variable (TDD)
   - RED `625cc0a17`: `test(188-20)`. 2 of 26 failed (the Render and Compose rows).
   - GREEN `ec392493f`: `feat(188-20)`. 26 of 26 passed.

## What changed

- `queue.ts`: createQueue keeps `inFlight: Promise<void> | undefined`. The `setInterval` callback returns at once while it is set. Otherwise it sets it to `flush().finally(() => { inFlight = undefined; })`. The module header and createQueue's TSDoc now say that a tick is skipped while the timer's previous flush runs, which keeps the events held within the cap plus one taken batch, and that a direct `flush` (as at shutdown) always runs. The default interval of 2000 ms, the cap of 1000 and the slice of 100 are unchanged.
- `queue.test.ts`: a `hangingProvider()` stand-in and the three cases above. The header now names the skipped tick and both stand-ins.
- `render.example.yaml`: `- key: ANALYTICS_FLUSH_INTERVAL_MS # how often queued events are handed to the provider, in milliseconds: 500 to 600000` with `value: '2000'`, placed after `ANALYTICS_POSTHOG_HOST`.
- `docker-compose.dev.yml`: `ANALYTICS_FLUSH_INTERVAL_MS: ${ANALYTICS_FLUSH_INTERVAL_MS:-2000}`, placed after `ANALYTICS_POSTHOG_HOST`.
- `analyticsEnvTemplates.test.ts`: `ANALYTICS_VARIABLES` has six names. All three header sentences that count the variables now say six.

## Verification

- Task 1 `<verify>`: the frontend queue unit test exited 0 (14 passed) and `yarn assert:comment-hygiene` exited 0 (0 violations). The tracer gate ran in auto mode (`_auto_chain_active: true`): `<verify>` was re-run end to end and passed, so the plan went on to Task 2.
- Task 2 `<verify>`: the dev-seed template test exited 0 (26 passed), and `prettier --check render.example.yaml docker-compose.dev.yml` exited 0.
- Also run:
  - eslint and prettier on both queue files: exit 0
  - frontend `typecheck`: exit 0, with 0 errors and 0 warnings
  - the other dev-seed tests that read these templates (`ciDockerImageBuildGate`, `deploymentTemplates`, `localSupabaseUrl`) together with the template test: 4 files, 120 passed, exit 0
- Every status above was read from its own line, never through a pipe.
- Acceptance criteria:
  - `grep -c inFlight queue.ts` = 4 (needed at least 2)
  - `grep -c ANALYTICS_FLUSH_INTERVAL_MS docker-compose.dev.yml` = 1
  - `grep -c 'key: ANALYTICS_FLUSH_INTERVAL_MS' render.example.yaml` = 1
  - All pass.
- **Targeted E2E.** CLAUDE.md asks for one for every project whose tests drive a route the plan's source change serves. Here that is the usage relay, which the queue serves.
  - Command: `FRONTEND_PORT=5273 PLAYWRIGHT_ANALYTICS_STANDALONE=1 tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/188-20-analytics-standalone-20261118T193738Z --no-db-reset --project analytics-default-standalone`
  - Result: exit 0, no VOID marker, 22 passed: `analytics-default-standalone` 20, plus setup 1 and teardown 1. 0 failed, 0 skipped, 0 flaky. The shared stack was restored (`restore: ok`).
- **Project test-count deltas against the last full run** (`tests/e2e-runs/187-28-close-20261116T234457Z`): 0 for every project. This plan adds, renames and changes no spec or fixture, and pins no title.

## Deviations from Plan

**1. [Rule 2 - CLAUDE.md] A targeted E2E run the plan did not list**
- **Found during:** close-out
- **Issue:** CLAUDE.md requires a targeted green run for every project whose tests drive a route the plan's source change serves. `queue.ts` serves the usage relay.
- **Fix:** one `analytics-default-standalone` run, as 188-01 made for the same route. It was green, as recorded above.
- **Commit:** none (evidence only)

**Total deviations:** 1 (evidence only). **Impact:** none on scope.

## Issues Encountered

None.

## Known Stubs

None.

## Threat Flags

None. T-188-02 is mitigated by the guard and covered by the hanging-provider cases. T-188-SC: no package was installed.

## Next Phase Readiness

- The full-queue observation (188-13) now measures the cap, not several overlapping flushes.
- RELAY-04 and RELAY-09 stay open in REQUIREMENTS.md, as the dispatch requires, until the deployed plans and the phase verifier close them.

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/server/analytics/queue.ts, apps/frontend/src/lib/server/analytics/queue.test.ts, packages/dev-seed/tests/analyticsEnvTemplates.test.ts, render.example.yaml, docker-compose.dev.yml
- FOUND commits: 8d9de1f49, a59757d5e, 625cc0a17, ec392493f
- FOUND run directory: tests/e2e-runs/188-20-analytics-standalone-20261118T193738Z
