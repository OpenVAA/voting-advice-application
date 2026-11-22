---
phase: 189-documentation-and-closure
plan: "02"
subsystem: frontend
tags: [env, constants, docker-compose, env-template, e2e]
status: complete

requires:
  - phase: 189 (CONTEXT B-03, F-03, H-02)
    provides: the decision to remove the two frontend-URL variables and keep the root compose
provides:
  - "PUBLIC_BROWSER_FRONTEND_URL and PUBLIC_SERVER_FRONTEND_URL are gone from constants.ts, the four auth test mocks, .env.example and the root docker-compose.dev.yml"
  - "Targeted E2E proof on the changed tree: bank-auth 12, contestant-identity-provider 42, voter-journey 2, delta 0"
affects: [189-09, 189-20]

actuals:
  tokens: 3239
  tasks: 3
  commits: 3
plan_head_before: a8ffa1455ebffeaecea86a465799bd73508a5cf2
plan_head_after: 55f1a523cbce7e67421901b515cb03420a186c27

tech-stack:
  added: []
  patterns:
    - "Before E2E or the unit gate, check which checkout the shared stack serves: compare the applied migration names, not just the count, and check the edge runtime's functions mount"

key-files:
  created:
    - .planning/workstreams/deployment/phases/189-documentation-and-closure/evidence/189-02-frontend-url-variables.md
  modified:
    - apps/frontend/src/lib/utils/constants.ts
    - apps/frontend/src/lib/api/utils/auth/__tests__/authorize-endpoint.test.ts
    - apps/frontend/src/lib/api/utils/auth/__tests__/callback-endpoint.test.ts
    - apps/frontend/src/lib/api/utils/auth/decryptAndVerifyIdToken.test.ts
    - apps/frontend/src/lib/api/utils/auth/providers/authorize-fail-closed.test.ts
    - .env.example
    - docker-compose.dev.yml

key-decisions:
  - "B-03 as measured: the re-grep finds no reader of either frontend-URL variable outside constants.ts and no dynamic read of the constants object, so both are removed"
  - "B03_HITS_BEFORE is recorded as measured (15), not as the plan's pinned 18. The three missing lines were removed by plan 189-01 with render.example.yaml and the guide's Render section"
  - "DOCS-04 stays Pending: this plan removes two variables from what the reference must list, and plan 189-09 rewrites the env page that completes it"

requirements-completed: [DOCS-07]

coverage:
  - id: D1
    description: "The frontend reads neither variable; its auth tests mock only what the module exports"
    requirement: DOCS-04
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/frontend test:unit src/lib/api/utils/auth -> 9 files, 255 passed; typecheck 0 errors 0 warnings"
        status: pass
    human_judgment: false
  - id: D2
    description: "Neither .env.example nor the root compose sets them; the compose parses and its template tests pass"
    requirement: DOCS-07
    verification:
      - kind: unit
        ref: "yarn workspace @openvaa/dev-seed test:unit tests/deploymentTemplates.test.ts tests/analyticsEnvTemplates.test.ts tests/localSupabaseUrl.test.ts -> 100 passed"
        status: pass
      - kind: other
        ref: "docker compose -f docker-compose.dev.yml config --quiet -> 0; yarn lint:check -> 0; yarn test:unit -> 0"
        status: pass
    human_judgment: false
  - id: D3
    description: "The served code is proven by the three projects the constants module serves"
    verification:
      - kind: e2e
        ref: "tests/e2e-runs/189-02-bank-auth-20261120T100056Z (12/12), 189-02-contestant-identity-provider-20261120T100212Z (42/42), 189-02-voter-journey-20261120T102018Z (2/2); e2e-spec-verdict --no-flaky VERDICT OK each"
        status: pass
    human_judgment: false

duration: 29min
completed: 2026-11-20
---

# Phase 189 Plan 02: The Two Frontend-URL Variables Summary

**Targeted E2E on HEAD `4f6ab8f8e`: `bank-auth` 12 passed, `contestant-identity-provider` 42 passed, `voter-journey` 2 passed. Each matches the last full run (`188-close3-20261119T213204Z`), so the delta is 0 with no title change. No test failed, was flaky or did not run, and no run was void. `PUBLIC_BROWSER_FRONTEND_URL` and `PUBLIC_SERVER_FRONTEND_URL` are no longer read, mocked, templated or set by the root compose.**

## Performance

- **Duration:** about 29 min
- **Started:** 2026-11-20T09:53:30Z
- **Completed:** 2026-11-20T10:22:41Z
- **Tasks:** 3
- **Files:** 1 created, 7 modified

## Accomplishments

- Re-grep (`git grep -n FRONTEND_URL -- ':!.planning'`) at execution: 15 lines. The only reader is `constants.ts`. No hit in `packages/`, `infra/`, `.github` or `tests/`, and the one `apps/docs` hit is the env page that plan 189-09 rewrites. The dynamic-read search finds nothing under either `-E` or `-P`.
- Deleted the two entries from the exported `constants` object and the two mock entries from each of the four auth test files. The auth tests pass (255) and the frontend typecheck is clean.
- Deleted the two lines from `.env.example`'s `# Frontend configuration` block (its banner and `FRONTEND_PORT=5173` stay) and from the frontend service's `environment:` map in the root `docker-compose.dev.yml`. The compose parses, and its three template test files pass (100 tests).
- `yarn lint:check` and `yarn test:unit` exit 0.
- Ran the three targeted E2E projects one after another on the last code commit, each with `restore: ok`.

## Task Commits

1. **Task 1 (tracer): the re-grep, then the reader and its four mocks gone**: `6f735d819` (refactor)
2. **Task 2: the env template and the root compose stop listing them**: `4f6ab8f8e` (chore)
3. **Task 3: the targeted E2E runs**: `55f1a523c` (test, evidence only)

After Task 1 the tracer verify was run again on the committed tree and passed, so expansion went ahead.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The shared stack was serving another checkout's schema**
- **Found during:** Task 2 (first `yarn test:unit`)
- **Issue:** two dev-seed integration tests failed with `column "election_type" of relation "elections" does not exist`. The shared `openvaa-local` stack had been started at 08:15Z from the `voting-advice-application-reviewfix` checkout, whose migration 00023 is `elections_nomination_shape_column`. The migration count was the same (24), so only the names showed the mismatch. Its edge runtime also mounted that checkout's functions.
- **Fix:** no E2E run and no dev server on 5273 was live, so under the standing stack authorisation the stack was put back with `yarn db:stop`, `yarn db:start`, `yarn db:reset` from this checkout. `yarn test:unit` then exited 0. No code changed.
- **Files modified:** none (recorded in the evidence file)
- **Commit:** `4f6ab8f8e` (evidence)

**2. [Measured count] `B03_HITS_BEFORE=15`, not the pinned 18**
- **Found during:** Task 1
- **Issue:** the acceptance criterion `grep -c '^B03_HITS_BEFORE=18$'` pins the research count. That count was taken before plan 189-01 removed `render.example.yaml` (2 lines) and the guide's Render section (1 line).
- **Fix:** both counts are recorded as measured: `B03_HITS_BEFORE=15`, and `B03_HITS_AT_PLAN_01_BASE=18` measured at `22e6d0939`. The value was not bent to match the pin, so that one acceptance grep prints 0.
- **Commit:** `6f735d819`

**Total deviations:** 2 (one environment fix, one measured count). The plan's scope was unchanged.

## Notes for later plans

- **The `-reviewfix` session:** the shared stack now serves `-infra`'s schema and functions. Before that checkout next uses the stack, it needs `yarn db:stop && yarn db:start` (and a reset) from its own worktree.
- **189-09 (env page):** `environmental-variables/+page.md:97` still lists both variables. It is the last line `git grep FRONTEND_URL` finds outside `.planning/`.
- **189-20 (full run):** this plan's E2E delta is 0 for `bank-auth`, `contestant-identity-provider` and `voter-journey`. The unit delta is 0.

## Issues Encountered

- `docker compose ... config` loads the root `.env` implicitly. It ran with `--quiet`, so nothing from that file was printed or read by the agent.

## Self-Check: PASSED

- FOUND: evidence/189-02-frontend-url-variables.md (`B03_DYNAMIC_READS=0`, `B03_NON_TEST_READERS=0`, `E2E_TARGETED_DELTA=0`)
- FOUND: the three run directories, none with `VOID-host-suspend.txt`
- FOUND: 6f735d819, 4f6ab8f8e, 55f1a523c (ancestors of HEAD)
- `git grep -l FRONTEND_URL -- apps/frontend/src .env.example docker-compose.dev.yml` lists no file
