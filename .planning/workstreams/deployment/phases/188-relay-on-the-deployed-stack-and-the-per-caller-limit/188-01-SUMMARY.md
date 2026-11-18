---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
plan: "01"
subsystem: analytics, infra
tags: [analytics, task-environment, terraform, vitest, queue]

requires:
  - phase: 182-analytics-relay
    provides: the analytics configuration resolver, the queue with its flush timer, the runtime
  - phase: 187-deploy-pipeline
    provides: the task-environment contract and both AWS roots' environment_values
provides:
  - ANALYTICS_FLUSH_INTERVAL_MS resolved with the other analytics variables (default 2000, accepted 500..600000, otherwise invalid and refusing start by name)
  - the resolved interval passed to createQueue in runtime.ts
  - the 17th entry of infra/modules/frontend-service/task-environment.json, with the runbook row, both AWS roots' tfvars line, the .env.example line and the module test
affects: [188-12, 188-13, 188-20]

actuals:
  tokens: 11011
  tasks: 1
  commits: 2
plan_head_before: fcaa5adfcec283bd9550dbcfd3e8ead779c440f1
plan_head_after: be3b0f9740d1163e8770e40f5a842ae7794cd4be

tech-stack:
  added: []
  patterns:
    - "A numeric analytics variable is read like the key and host: trimmed, `^\\d+$` and bounds, an invalid problem with no `provided` value"

key-files:
  created: []
  modified:
    - apps/frontend/src/lib/server/analytics/config.ts
    - apps/frontend/src/lib/server/analytics/config.test.ts
    - apps/frontend/src/lib/server/analytics/runtime.ts
    - apps/frontend/src/lib/server/analytics/relay.test.ts
    - apps/frontend/src/lib/server/analytics/providers/index.test.ts
    - apps/frontend/src/lib/server/startup/taskEnvironment.test.ts
    - infra/modules/frontend-service/task-environment.json
    - infra/modules/frontend-service/tests/frontend_service.tftest.hcl
    - infra/envs/staging/aws/terraform.tfvars
    - infra/envs/example/aws/terraform.tfvars
    - infra/envs/staging/aws/README.md
    - .env.example

key-decisions:
  - "The flush interval is read after the PostHog variables and sits last in ANALYTICS_ENV, so problems stay in variable order; a valid interval is kept when another variable forces provider none, as the two modes are"
  - "The contract entry sits after ANALYTICS_POSTHOG_HOST in task-environment.json and the runbook table, as the plan placed it"

patterns-established:
  - "AnalyticsConfig.flushIntervalMs is always present; every AnalyticsConfig literal carries it"

requirements-completed: [RELAY-04, RELAY-09]

coverage:
  - id: D1
    description: "ANALYTICS_FLUSH_INTERVAL_MS resolves: unset/blank 2000, 500..600000 taken trimmed, anything else invalid with no provided value, provider none, start refused by name"
    requirement: RELAY-04
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/server/analytics/config.test.ts#resolveAnalyticsConfig: the flush interval"
        status: pass
      - kind: unit
        ref: "apps/frontend/src/lib/server/analytics/config.test.ts#analyticsStartupProblems names the flush interval for an invalid value and nothing for a valid one"
        status: pass
    human_judgment: false
  - id: D2
    description: "runtime.ts passes analyticsConfig.flushIntervalMs to createQueue, and the relay route still answers and forwards with the variable unset"
    requirement: RELAY-04
    verification:
      - kind: other
        ref: "grep -c 'flushIntervalMs: analyticsConfig.flushIntervalMs' apps/frontend/src/lib/server/analytics/runtime.ts = 1"
        status: pass
      - kind: e2e
        ref: "PLAYWRIGHT_ANALYTICS_STANDALONE=1 tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/188-01-analytics-standalone-20261118T175613Z --no-db-reset --project analytics-default-standalone (22 expected, 0 unexpected, exit 0)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The task-environment contract lists the name as a value entry that is not required; .env.example, the staging runbook table, both AWS roots and the module test (17 entries) agree"
    requirement: RELAY-09
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/server/startup/taskEnvironment.test.ts#agrees with REQUIRED_ENV, ANALYTICS_ENV, .env.example, the runbook and every AWS root's variable file"
        status: pass
      - kind: other
        ref: "terraform -chdir=infra/modules/frontend-service test -no-color (Success! 33 passed, 0 failed)"
        status: pass
    human_judgment: false

duration: 8min
completed: 2026-11-18
status: complete
---

# Phase 188 Plan 01: `ANALYTICS_FLUSH_INTERVAL_MS` from the task environment to the queue timer Summary

**A private `ANALYTICS_FLUSH_INTERVAL_MS` (default 2000, integer 500 to 600000, otherwise refusing start by name with no value in the problem) now reaches the queue timer through `createQueue`. It is also the 17th, non-required `value` entry of the task-environment contract, and every place the contract test checks lists it.**

## New test cases

In `apps/frontend/src/lib/server/analytics/config.test.ts`:

- `resolveAnalyticsConfig: the flush interval` › pins the default at 2000 ms and the accepted range at 500 to 600000 ms
- › resolves an interval that is unset / blank / whitespace only to the default, with no problem (3 cases)
- › takes the interval "500" / "600000" / " 2000 " as 500 / 600000 / 2000 ms, trimmed as every value is (3 cases)
- › reports the interval "499" / "600001" / "2s" / "1e3" / "-1" as invalid, without a provided value, and resolves the provider to `none` and the interval to the default (5 cases)
- › keeps a valid interval when another variable has a problem
- › never puts the interval value into a problem
- `analyticsStartupProblems` › names the flush interval for an invalid value and nothing for a valid one
- The existing "never throws and resolves to defaults for a non-string value" case also sets `ANALYTICS_FLUSH_INTERVAL_MS` to each hostile value.

That makes 15 new cases. Every existing `toEqual` of a resolved config, and every `toProjection` input, now carries `flushIntervalMs: 2000`.

## Performance

- **Duration:** about 8 min (2026-11-18T17:49:23Z to 2026-11-18T17:57:51Z)
- **Tasks:** 1 (tracer, tdd)
- **Files modified:** 12

## Accomplishments

- `config.ts`: `ANALYTICS_ENV.flushIntervalMs`, `AnalyticsConfig.flushIntervalMs: number` (always present), and the exported `DEFAULT_FLUSH_INTERVAL_MS` (2000), `MIN_FLUSH_INTERVAL_MS` (500) and `MAX_FLUSH_INTERVAL_MS` (600000). `readFlushInterval` takes only `^\d+$` within the bounds on the trimmed value. Anything else gives `{ variable, reason: 'invalid' }` with no `provided` key, and the provider falls to `none` as it does for every other problem.
- `runtime.ts`: `createQueue({ provider, flushIntervalMs: analyticsConfig.flushIntervalMs })`.
- Contract: a new entry in `task-environment.json` after the PostHog host entry, with the description the plan specified. It is also in `ANALYTICS_NAMES` and `SOUND_ENTRIES` of `taskEnvironment.test.ts`, gets `ANALYTICS_FLUSH_INTERVAL_MS = "2000"` in both `environment_values` blocks of the module test (which now counts 17 entries, or 16 with one omitted) and in both AWS roots' tfvars (aligned by `terraform fmt`), and has a runbook table row (reformatted by Prettier) and a commented `.env.example` line with one comment line.

## Task Commits

1. **Task 1 RED:** `de5da4940` test(188-01): the flush interval's default, bounds and refusal cases. Observed red: 29 failed and 7 passed of 36, every failure an `AssertionError`.
2. **Task 1 GREEN:** `be3b0f974` feat(188-01): ANALYTICS_FLUSH_INTERVAL_MS from the task environment to the queue timer

## Verification

- Plan `<verify>`: `yarn workspace @openvaa/frontend test:unit src/lib/server/analytics src/lib/server/startup` passed, 9 files and 234 tests, exit 0. `terraform init` exit 0. `terraform test` printed `Success! 33 passed, 0 failed.` with exit 0. `terraform fmt -check -recursive` on the three directories exited 0 and printed nothing. `prettier --check` on the runbook exited 0. Each status was read from its own line, not through a pipe.
- Also run: eslint on `src/lib/server/analytics` and `taskEnvironment.test.ts` exit 0, the frontend `typecheck` exit 0 (0 errors, 0 warnings), and `prettier --check` on the changed frontend files, `.env.example` and the json exit 0.
- Tracer gate: auto mode is off and `<verify>` is automated-only, so `<verify>` was re-run. The unit part ran again after the last edit, which only changed a comment, and passed. Tracer verified end to end.
- Acceptance criteria: the json has 1 match. `runtime.ts` has 1 match. The tftest line 187 reads `length(output.task_environment_names) == 17`. The staging tfvars has 1 match. All PASS.
- **Targeted E2E** (CLAUDE.md: projects whose tests drive a route this plan's source change serves, here the usage relay that `runtime.ts` serves):
  - Command: `PLAYWRIGHT_ANALYTICS_STANDALONE=1 tests/scripts/e2e-run.sh --run-dir tests/e2e-runs/188-01-analytics-standalone-20261118T175613Z --no-db-reset --project analytics-default-standalone`
  - Result: exit 0, no VOID marker. `analytics-default-standalone` 20 expected, plus setup 1 and teardown 1. 22 expected, 0 unexpected, 0 skipped, 0 flaky.
  - The project runs the same four spec files as `voter-prefs-tracking`, which had 20 tests in the last full run (`tests/e2e-runs/187-28-close-20261116T234457Z`, 729 expected, 0 unexpected).
- **Project test-count deltas against the last full run:** 0 for every project. This plan adds, renames and changes no spec or fixture, and pins no title.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Config literals in two analytics test files outside the plan's file list**
- **Found during:** Task 1
- **Issue:** `AnalyticsConfig.flushIntervalMs` is required, so `LOG_CONFIG` in `relay.test.ts` and the spread `MODES` in `providers/index.test.ts` would no longer typecheck.
- **Fix:** `LOG_CONFIG` gains `flushIntervalMs: 2000`. In `providers/index.test.ts` the constant becomes `SETTINGS` (it now holds more than the modes), carries `flushIntervalMs: 2000`, and has its TSDoc updated.
- **Files modified:** apps/frontend/src/lib/server/analytics/relay.test.ts, apps/frontend/src/lib/server/analytics/providers/index.test.ts
- **Verification:** frontend typecheck 0 errors; the analytics unit tests green
- **Commit:** be3b0f974

**2. [Rule 2 - CLAUDE.md] A targeted E2E run the plan did not list**
- **Found during:** close-out
- **Issue:** CLAUDE.md requires a targeted green run of every project whose tests drive a route the plan's source change serves. `runtime.ts` serves the usage relay.
- **Fix:** one `analytics-default-standalone` run. It was green, as recorded above.
- **Commit:** none (evidence only)

**3. [Process] TDD as two commits within one task**
- The plan keeps its ten files in one task. The tdd="true" cycle was carried out as a RED commit holding `config.test.ts` alone, then one GREEN commit with everything else. The unit suite is red only at `de5da4940`, which is the RED evidence.

**Total deviations:** 2 auto-fixed (1 blocking, 1 CLAUDE.md evidence) and 1 process note. **Impact:** none on scope. The default interval stays 2000, and no raw value reaches a problem.

## Issues Encountered

None.

## Known Stubs

None.

## Next Phase Readiness

- `packages/dev-seed/tests/analyticsEnvTemplates.test.ts` still names five analytics variables, and `render.example.yaml` and `docker-compose.dev.yml` do not carry the new one. Plan 188-20 covers those, as planned, along with the queue's in-flight guard.
- Ready for 188-02.

## Self-Check: PASSED

- The 12 modified files exist; `git status` shows no stray changes outside `.planning/`.
- Commits `de5da4940` and `be3b0f974` are ancestors of HEAD; `git rev-list --count fcaa5adfc..HEAD` = 2.
