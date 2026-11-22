---
phase: 186-deployed-smoke-entry
plan: "01"
subsystem: testing
tags: [e2e, deployed-smoke, gate, vitest, supabase, tfvars]
status: complete

requires: []
provides:
  - "tests/tests/utils/deployedTarget.ts: the pure deployed-target gate (tfvars parse, env-block parse, four ordered identity checks, config-shape check, input reader)"
  - "tests/tests/utils/deployedTarget.test.ts: 76 vitest cases, the refusal matrix against a loopback stub server"
affects: [186-02 deployed global setup and config, 186-03 smoke guards, 186-07 local close, 187 pipeline wiring]

actuals:
  tokens: 9461
  tasks: 2
  commits: 4
plan_head_before: 89d9873a85b0a78933f99deaae5203fa055d5c6b
plan_head_after: b9dd2176865bd2593e1955c8a878c72accfb468e

tech-stack:
  added: []
  patterns:
    - "Gate as a pure module taking env, baseURL and repoRoot as arguments; tested against http.createServer on port 0"
    - "Expected identity read only from the committed tfvars; no argument or variable can name a ref or project id"

key-files:
  created:
    - tests/tests/utils/deployedTarget.ts
    - tests/tests/utils/deployedTarget.test.ts
  modified: []

key-decisions:
  - "SUPA-09 left Pending in REQUIREMENTS.md: all eight phase-186 plans carry it and it is met only by the hosted run of 186-08, so marking it complete after the pure module would overstate it"
  - "assertSmokeProjects treats an empty dependencies array and an empty teardown string as absent; any non-empty value is refused"
  - "A request failure observed line carries the system error code when fetch gives one, e.g. 'fetch failed (ECONNREFUSED)'"
  - "The two target requests run concurrently (Promise.all); each has its own AbortSignal.timeout"

patterns-established:
  - "Ref check: https, no port, user info, query or hash, path empty or '/', host exactly one DNS label + .supabase.co, equal to the tfvars project_ref"

requirements-completed: []

coverage:
  - id: D1
    description: "runDeployedGate evaluates service-role-key-absent, sha, ref, project-id in order against a target, one PASS/FAIL line each, never short-circuiting"
    requirement: "SUPA-09"
    verification:
      - kind: unit
        ref: "tests/tests/utils/deployedTarget.test.ts#runDeployedGate against a stub target"
        status: pass
  - id: D2
    description: "Every non-dedicated ref, project id, sha and key-variable state is refused; no environment input widens the ref"
    requirement: "SUPA-09"
    verification:
      - kind: unit
        ref: "tests/tests/utils/deployedTarget.test.ts#the ref check fails closed / no input widens the ref"
        status: pass
  - id: D3
    description: "assertSmokeProjects and requireSmokeInputs refuse bad config shapes and missing inputs without printing values"
    requirement: "SUPA-09"
    verification:
      - kind: unit
        ref: "tests/tests/utils/deployedTarget.test.ts#assertSmokeProjects / requireSmokeInputs"
        status: pass

duration: 4min
completed: 2026-11-15
---

# Phase 186 Plan 01: Deployed-target gate module Summary

**76 vitest cases, all passing. The exported symbols:**

- **Constants:** `DEDICATED_SUPABASE_TFVARS`, `DEFAULT_SMOKE_BASE_URL`, `SMOKE_PROJECT_NAME`, `DEPLOYED_GATE_HEADLINE`, `FORBIDDEN_KEY_VARIABLES`, `GATE_CHECK_ORDER`
- **Types:** `GateEnv`, `GateCheckName`, `GateCheck`, `DedicatedTarget`, `FetchedDocument`, `GateResult`, `SmokeProjectShape`
- **Functions:** `readDedicatedTarget`, `extractServedEnv`, `servedSupabaseRef`, `extractServedProjectId`, `evaluateGate`, `formatGateLine`, `runDeployedGate`, `gateFailureMessage`, `assertSmokeProjects`, `requireSmokeInputs`

The module proves a deployed target by its served Supabase ref and its served project id. It reads both expected values only from `project_ref` and `public_project_id` in the committed staging tfvars. It also checks the served build against `SMOKE_EXPECTED_SHA` and fails when a service-role or secret key variable is set. It does all of this without importing anything from the local gate.

## Performance

- **Duration:** about 4 min
- **Started:** 2026-11-14T22:45:41Z
- **Completed:** 2026-11-14T22:49:53Z
- **Tasks:** 2
- **Files created:** 2 (`deployedTarget.ts` 394 lines, `deployedTarget.test.ts` 505 lines)

## Accomplishments

- `runDeployedGate({ env, baseURL, repoRoot, fetchImpl?, timeoutMs? })` reads the tfvars, requests `/api/health` and `/`, and returns four checks in the order service-role-key-absent, sha, ref, project-id, with one line per check. A refused connection or a timeout becomes FAIL lines and never an exception.
- The ref check fails closed on 14 URL shapes, among them the deleted throwaway `begckvkapaopoztbreqc`, both local-stack addresses, a host with the ref as user info and a host with the ref as subdomain prefix. It also fails on 4 document shapes: no env line, `env: null`, a value that is not JSON, and a missing URL. A trailing `/` passes.
- The "no input widens the ref" case gives the gate an environment of 17 variables, every one naming a foreign ref, URL or id. The ref check still fails, and against the green stub the checks deep-equal those from `{ SMOKE_EXPECTED_SHA }` alone.
- A key-variable FAIL line names the variable with "(value withheld)". The made-up value appears in no line, in no serialised result and in no failure message.
- `assertSmokeProjects` and `requireSmokeInputs` are in place for the deployed config and the contestant spec of the later plans.

## Task Commits

1. **Task 1 (tracer): gate end to end against a stub target**
   - RED `704c0a8d0`: `test(186-01): add failing cases for the deployed-target gate end to end`
   - GREEN `dfa4e2ade`: `feat(186-01): add the deployed-target gate module`
   - Tracer gate: the verify commands were re-run end to end and passed (7/7, eslint, typecheck:tests, comment hygiene), so expansion went ahead.
2. **Task 2: refusal matrix, config-shape check, input reader**
   - RED `2e6ece798`: `test(186-01): add the refusal matrix and failing config-shape and input cases`. 63 of the 76 cases already passed against Task 1's module. The 13 red cases were exactly those of the two missing functions.
   - GREEN `b9dd21768`: `feat(186-01): add the smoke config-shape check and the input reader`

## Verification

- `node_modules/.bin/vitest run --config tests/vitest.config.ts deployedTarget`: exit 0, `Tests 76 passed (76)`, none skipped
- `node_modules/.bin/eslint` on both files: exit 0
- `yarn typecheck:tests`: exit 0
- `node scripts/assert-comment-hygiene.mjs`: exit 0, 0 violations
- `yarn test:unit:tests`: exit 0, `Test Files 11 passed (11)`, `Tests 265 passed (265)`
- `prettier --check` on both files: clean
- Acceptance greps: `export async function runDeployedGate` 1; `export function assertSmokeProjects` 1; `export function requireSmokeInputs` 1; `begckvkapaopoztbreqc` in the test 2; `made-up-service-role-value` in the module 0; imports from global-setup, playwright.config or support/preflight 0. For the environment-read grep, see Deviations.

## Files Created/Modified

- `tests/tests/utils/deployedTarget.ts`: the pure gate module, with no top-level side effect and no read of the environment of its own
- `tests/tests/utils/deployedTarget.test.ts`: the stub-server refusal matrix

## Decisions Made

See `key-decisions` in the frontmatter. The main one is that SUPA-09 stays Pending.

## Deviations from Plan

### Judgement calls (operator away; safest reversible option taken)

**1. SUPA-09 not marked complete**
- **Issue:** The protocol marks the plan's `requirements` complete. But all eight phase-186 plans list SUPA-09, and the requirement is met only by the hosted run in 186-08.
- **Action:** `requirements.mark-complete` was skipped. SUPA-09 stays `Pending` in REQUIREMENTS.md. Marking it later is a single command.

**2. Acceptance grep for the environment read run with an equivalent pattern**
- **Issue:** The plan's grep `grep -c 'process\.env' …` was refused by the session's secret-read hook. The hook misreads the pattern text as a `.env` file read.
- **Action:** `grep -cE 'process[.]' tests/tests/utils/deployedTarget.ts` was run instead and gave `0`. This pattern is stricter, because it matches any `process.` member access. No file other than the module was read.

### Auto-fixed Issues

None. Apart from the above, the plan was executed as written. The one addition is the exported type `SmokeProjectShape`, the parameter type of `assertSmokeProjects`, which needs a named type to carry TSDoc.

## Issues Encountered

None.

## Known Stubs

None.

## Threat Flags

None. The module opens no new surface: it issues GET requests only to the caller's target, and its key checks print names only (T-186-01, T-186-02 and T-186-03 are mitigated as planned).

## Next Phase Readiness

`tests/deployed-global-setup.ts` and `tests/playwright.deployed.config.ts` (186-02) can import `runDeployedGate`, `gateFailureMessage`, `assertSmokeProjects`, `DEFAULT_SMOKE_BASE_URL` and `SMOKE_PROJECT_NAME` directly.

## Self-Check: PASSED

- FOUND: tests/tests/utils/deployedTarget.ts
- FOUND: tests/tests/utils/deployedTarget.test.ts
- FOUND: 704c0a8d0, dfa4e2ade, 2e6ece798, b9dd21768 (all ancestors of HEAD)
