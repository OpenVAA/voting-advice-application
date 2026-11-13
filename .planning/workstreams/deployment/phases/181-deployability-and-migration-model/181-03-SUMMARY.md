---
phase: 181-deployability-and-migration-model
plan: 03
subsystem: infra
tags: [sveltekit, adapter-node, hooks, environment, diagnostics, vitest]

# Dependency graph
requires:
  - phase: 181-01
    provides: node_modules installed under Node 24.21.0, and the baseline of the frontend unit suite (3575 passed, 20 skipped)
provides:
  - apps/frontend/src/lib/server/startup/requiredEnv.ts with REQUIRED_ENV, STARTUP_RULES, missingRequiredEnv and the types StartupEnv and StartupRule
  - the init export of apps/frontend/src/hooks.server.ts, which throws one naming error on a production start with a required variable unset
  - GET /api/diagnostics, 404 unless DEPLOYMENT_DIAGNOSTICS is true
  - a Vitest alias and an empty, mutable test stub for $env/dynamic/private
affects: [181-04, 181-09, 181-13, 182, 185]

# Actuals (#2632)
# tokens is chars/4 over the diff plan_head_before..plan_head_after (23067 characters, seven files).
# commits is measured when this summary was written: git rev-list --count plan_head_before..HEAD.
# The commit of this summary and the state commit come after it and are not in the count.
actuals:
  tokens: 5767
  tasks: 3
  commits: 5
plan_head_before: f8caa58b551d0c8729698a70d5fbd1053ce01577
plan_head_after: e96f1be23c830922085fc830e52700202dd1bec2

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A server check is a pure function over an environment record; the hook that calls it holds the only throw"
    - "A start-up requirement is a rule in a list (a function declaration from an environment to the missing names), not a conditional in the hook"
    - "A unit test sets a private variable on the $env/dynamic/private stub and removes it with Reflect.deleteProperty in afterEach"

key-files:
  created:
    - apps/frontend/src/lib/server/startup/requiredEnv.ts
    - apps/frontend/src/lib/server/startup/requiredEnv.test.ts
    - apps/frontend/src/routes/api/diagnostics/+server.ts
    - apps/frontend/src/routes/api/diagnostics/server.test.ts
    - apps/frontend/src/lib/i18n/tests/__mocks__/env-dynamic-private.ts
  modified:
    - apps/frontend/src/hooks.server.ts
    - apps/frontend/vitest.config.ts

key-decisions:
  - "181-03: each RED commit holds a skeleton of the module under test (the contract's signatures, no behaviour) beside the test. Without it the test fails while loading the module, which the TDD reference counts as an invalid RED."
  - "181-03: RED evidence is taken with Vitest's JUnit reporter. The RED classifier rejects the output of both TAP reporters as malformed, because Vitest prints a multi-line expected value unindented inside the diagnostic block."
  - "181-03: the type check was not run, as the plan orders. The new files have passed eslint, prettier and Vitest, and no compiler. Plan 181-09 runs the type check."
  - "181-03: init is the last export of hooks.server.ts, after handleError. A further start-up rule is a function declaration appended to STARTUP_RULES; an arrow function assigned to a const fails the func-style lint rule."

patterns-established:
  - "missingRequiredEnv returns data and never throws or logs; the caller decides what a non-empty result means"
  - "A route that reports request data reports an allow-list of header names, and its test puts credentials on the request before it asserts they are absent from the body"

# The plan's frontmatter lists SUPA-10 as the phase's closing requirement, and the template orders the
# list to be copied. This plan closes nothing: SUPA-10 is NOT closed and was not marked complete
# (requirements.ready-ids answered "0/1 requirement(s) ready to mark complete").
requirements-completed: [SUPA-10]

coverage:
  - id: D1
    description: "missingRequiredEnv names every unset required variable, counts an empty, whitespace-only or non-string value as unset, keeps rule order with each name once, and returns names only"
    verification:
      - kind: unit
        ref: "apps/frontend/src/lib/server/startup/requiredEnv.test.ts (13 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "hooks.server.ts exports init, which outside development and the build throws one error naming every unset required variable"
    verification:
      - kind: other
        ref: "Task 2 <verify><automated> of 181-03-PLAN.md, run verbatim: exit 0 (routeConsistency.test.ts 55 passed, both greps, eslint over the hooks file and the startup directory)"
        status: pass
    human_judgment: true
    rationale: "No test runs init. The unit tests cover the function it calls, and the verify command shows only that the export and the call are present and lint clean. That a production start exits non-zero and names the variables is observed on the built server in plan 181-09."
  - id: D3
    description: "GET /api/diagnostics throws the kit 404 unless DEPLOYMENT_DIAGNOSTICS is true, and when enabled answers 200 with the origin, the client address, an allow-list of forwarding headers and cache-control: no-store, writing nothing to the console"
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/api/diagnostics/server.test.ts (11 tests)"
        status: pass
    human_judgment: false
  - id: D4
    description: "The $env/dynamic/private alias broke no existing suite"
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/frontend test:unit on commit e96f1be23, tree clean: exit 0, 196 files passed and 1 skipped, 3599 tests passed and 20 skipped"
        status: pass
    human_judgment: false

# Metrics
duration: 11min
completed: 2026-10-12
status: complete
---

# Phase 181 Plan 03: Start-up Variable Check and Diagnostics Route Summary

**A pure `missingRequiredEnv` over a list of rules, an `init` hook that refuses a production start when `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`, `PUBLIC_PROJECT_ID` or `ORIGIN` is unset, and `GET /api/diagnostics`, which is 404 unless `DEPLOYMENT_DIAGNOSTICS` is `true`. All of it is unit-level: nothing here was observed on a built server, and the type check was not run.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-10-12T17:06:25Z
- **Completed:** 2026-10-12T17:17:00Z
- **Tasks:** 3 of 3
- **Files modified:** 7 (5 new, 2 changed)

## Accomplishments

- `requiredEnv.ts` exports the four required names, a rule list that holds one rule today, and `missingRequiredEnv`, which applies the rules and returns the missing names in rule order, each once.
- `hooks.server.ts` exports `init`. It returns at once when `dev` or `building` is true. Otherwise it merges the private and public dynamic environments, calls `missingRequiredEnv`, and throws `Required environment variables are not set: ` followed by the names joined with `, `.
- `/api/diagnostics` reads its switch at call time, refuses with the kit 404, and when enabled reports `url.origin`, the result of `getClientAddress()` (or the message it threw) and the seven allow-listed headers the request carried.
- Vitest resolves `$env/dynamic/private` to a stub, so a test can drive a handler that reads a private variable.

## Recorded statuses

Every status was read from `$?` of the command itself, with the output sent to a file under `tmp/181-03/`. None of these commands goes through turbo.

| Check | Command | Status |
|-------|---------|--------|
| Task 1 verify | `yarn workspace @openvaa/frontend test:unit src/lib/server/startup/requiredEnv.test.ts` | 0 (13 passed) |
| Task 2 verify | the plan's chained command: `routeConsistency.test.ts`, two greps, eslint over `src/hooks.server.ts` and `src/lib/server/startup` | 0 (55 passed) |
| Task 3 verify | `yarn workspace @openvaa/frontend test:unit src/routes/api/diagnostics/server.test.ts src/lib/server/startup/requiredEnv.test.ts` | 0 (2 files, 24 passed) |
| Whole frontend suite | `yarn workspace @openvaa/frontend test:unit`, on commit `e96f1be23` with a clean tree | 0 (196 files passed, 1 skipped; 3599 tests passed, 20 skipped) |
| eslint, all seven files | `yarn workspace @openvaa/frontend exec eslint` over the diagnostics directory, the stub, `vitest.config.ts`, `src/hooks.server.ts`, `src/lib/server/startup` | 0 |
| prettier, all seven files | `yarn prettier --check` over the same paths | 0 |
| Comment hygiene | `node scripts/assert-comment-hygiene.mjs` | 0 (0 violations) |

The whole-suite count is the baseline of plan 181-01 (3575 passed, 20 skipped) plus the 24 tests this plan adds.

**Not run, as the plan orders:** `svelte-kit sync`, the type check, the whole-workspace lint, a build, `yarn test:unit` at the root. No database and no Docker command was run.

## Task Commits

1. **Task 1: The required-environment check as a pure function**
   - `de67367e3` (test): the failing test and a skeleton of the module
   - `8ee12e94e` (feat): the implementation
2. **Task 2: The init export in hooks.server.ts** - `d0cb8fc76` (feat). `git show --stat --format= d0cb8fc76` lists `apps/frontend/src/hooks.server.ts` and no other file; the only line removed is the `import type` line it extends.
3. **Task 3: The diagnostics route, off by default**
   - `45b3dc59e` (test): the failing test, a skeleton of the route, the Vitest alias and the stub
   - `e96f1be23` (feat): the handler

## RED evidence

Both RED records were passed to `gsd-tools check tdd-red-evidence` and both returned `RED_EVIDENCE_OK` (`target_test_failed`). The records are under `tmp/181-03/` (ignored by git).

| Task | Target test | Result of the RED run | Semantic assessment |
|------|-------------|-----------------------|---------------------|
| 1 | `missingRequiredEnv > returns two absent names in the order of REQUIRED_ENV, whatever order they were removed in` | exit 1; 13 tests, 12 failed, 1 passed | The target ran and failed on its own `toEqual` (`expected [] to deeply equal [ 'PUBLIC_SUPABASE_URL', 'ORIGIN' ]`). The one test that passed asserts that a complete environment gives `[]`, which the skeleton also returns. |
| 3 | `GET /api/diagnostics > throws the kit 404 error when the switch is unset` | exit 1; 11 tests, 11 failed | The target ran and failed on its own assertion (`isHttpError(thrown, 404)` was false, because the skeleton answers 501 and throws nothing). Eight tests failed on assertions. Three failed while parsing the skeleton's empty body; they are not the target. |

## Files Created/Modified

- `apps/frontend/src/lib/server/startup/requiredEnv.ts` - the required names, the rule list and `missingRequiredEnv`; imports nothing
- `apps/frontend/src/lib/server/startup/requiredEnv.test.ts` - 13 cases, one or more for each of the seven behaviours of the plan, and the equality of `REQUIRED_ENV`
- `apps/frontend/src/hooks.server.ts` - four imports, `ServerInit` added to the type import, and the `init` export at the end of the file
- `apps/frontend/src/routes/api/diagnostics/+server.ts` - the `GET` handler, the header allow-list, the body type and the switch test
- `apps/frontend/src/routes/api/diagnostics/server.test.ts` - 11 cases, the 404 cases first
- `apps/frontend/vitest.config.ts` - the alias for `$env/dynamic/private`, next to the one for `$env/dynamic/public`
- `apps/frontend/src/lib/i18n/tests/__mocks__/env-dynamic-private.ts` - the stub: `env` as an empty `Record<string, string | undefined>`

## Decisions Made

- **A skeleton in each RED commit.** See the first deviation.
- **JUnit for RED evidence.** See the second deviation.
- **`missingRequiredEnv` does not catch an error thrown by a rule.** The contract says it never throws; that holds for every environment value with the shipped rule. A rule that throws is a defect of the rule, and catching it would let a server start with a check that did not run.
- **The body type and the switch test are not exported from `+server.ts`.** SvelteKit accepts only its own export names from a `+server` file. The test restates the body type and the allow-list locally.
- **One case more than the six behaviours** in the diagnostics test: an allow-listed header the request does not carry is left out of the body. The credential case also carries `x-api-key`, a third header outside the allow-list.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Each RED commit holds a skeleton of the module under test**
- **Found during:** Task 1, then Task 3
- **Issue:** The plan says to write the test first and see it fail. With no module file, the test fails while importing it. The TDD reference names an import fault as an invalid RED that does not authorise the implementation.
- **Fix:** `de67367e3` adds `requiredEnv.ts` with the contract's types and signatures, an empty `REQUIRED_ENV`, an empty `STARTUP_RULES` and a `missingRequiredEnv` that returns `[]`. `45b3dc59e` adds a `+server.ts` whose `GET` answers 501. The implementations are in the `feat` commits that follow, so the git log shows the failing test before the implementation.
- **Files modified:** `apps/frontend/src/lib/server/startup/requiredEnv.ts`, `apps/frontend/src/routes/api/diagnostics/+server.ts`
- **Verification:** both RED records returned `RED_EVIDENCE_OK`
- **Committed in:** `de67367e3`, `45b3dc59e`

**2. [Rule 3 - Blocking] RED evidence taken with the JUnit reporter**
- **Found during:** Task 1
- **Issue:** The classifier answered `INVALID_RED` (`invalid_record`: "Non-TAP data in report", "Malformed TAP") for the output of `--reporter=tap-flat` and of `--reporter=tap`. Vitest prints a multi-line `expected` value unindented inside the YAML block of a failed assertion, and the classifier's TAP parser is strict.
- **Fix:** the same target was run again through the project's test command with `--reporter=junit --outputFile=<path>`, as the reference orders for an incompatible reporter. The report was not edited.
- **Files modified:** none tracked
- **Verification:** `RED_EVIDENCE_OK` for both tasks
- **Committed in:** not applicable

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** neither changes what was built. The first puts two short-lived skeletons into the history; the second changes only how the RED run was recorded.

## Issues Encountered

- **`func-style` lint errors in both new test files**, where a helper was first written as an arrow function assigned to a const. Each was rewritten as a function declaration before its RED commit. The RED evidence of Task 1 was taken again after that rewrite, on the file as committed.
- **`apps/frontend/svelte.config.test.ts` already exists and is tracked.** The plan names it as a file plan 181-04 is writing in the same wave. It passed in the whole-suite run. `apps/frontend/src/routes/api/health/` does not exist yet.

## What a later plan must know

- **The type check has not seen these files.** They passed eslint, prettier and Vitest only. Plan 181-09 runs the type check before it builds. The places where a type error is least unlikely: the spread of the two dynamic environments in `init`; `env[SWITCH] = value` on `$env/dynamic/private` in the diagnostics test; `vi.spyOn(console, method)` with a union of four method names; `error(404)` with no body against this application's `App.Error`.
- **`init` has not been run.** Whether the built server exits non-zero and prints the message is plan 181-09's observation. An empty or invalid `ORIGIN` never reaches `init`: adapter-node refuses it first with its own message.
- **Phase 182 adds its rule** by appending a function declaration to `STARTUP_RULES` in `requiredEnv.ts`. It need not touch `hooks.server.ts` for that. The rule receives the merged private and public environment.
- **`$env/dynamic/private` now resolves in every frontend unit test** to an empty stub. The seven existing test files that call `vi.mock('$env/dynamic/private', …)` still pass. A test that sets a variable on the stub must remove it again; the stub is one object for the whole test file.
- **The diagnostics switch** is on only when `DEPLOYMENT_DIAGNOSTICS.trim().toLowerCase()` is `true`. `1`, `yes` and `false` leave it off. The body is `{ origin, clientAddress, clientAddressError, headers }`. When `getClientAddress()` throws, the status is still 200.
- **`DEPLOYMENT_DIAGNOSTICS` and the newly required `ORIGIN` are in no template and no document yet.** This plan's file list holds neither `.env.example` nor the guides.
- **A TDD task in this repository** takes its RED evidence with `--reporter=junit --outputFile=<path under tmp/>`; both TAP reporters are rejected by the classifier.

## Known Stubs

None. The two skeletons of the RED commits were replaced in the `feat` commits. `env-dynamic-private.ts` is a test stub by design and is used only by Vitest.

## User Setup Required

None.

## Next Phase Readiness

- Plans 181-09 and 181-13 can use the contracts of this plan's `interfaces` block as written.
- Not closed here: SUPA-10 stays open until the last plan of the phase.

## Self-Check: PASSED

- The seven files of the plan exist.
- Commits `de67367e3`, `8ee12e94e`, `d0cb8fc76`, `45b3dc59e` and `e96f1be23` are ancestors of `HEAD`.
- `commits: 5` is `git rev-list --count f8caa58b5..HEAD` at the time of writing, with `HEAD` at `e96f1be23`.
- `git status --porcelain --untracked-files=no` printed nothing before this summary was written.
- A `test(181-03)` commit precedes the `feat(181-03)` commit of each TDD task.
- Every acceptance criterion of the three tasks was checked by command after the last task commit; all hold. For the fourth criterion of Task 3 the first branch applies: the whole frontend suite exited 0.

---
*Phase: 181-deployability-and-migration-model*
*Completed: 2026-10-12*
