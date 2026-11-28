---
phase: 185-aws-frontend-stack-first-apply-by-hand
plan: "02"
subsystem: infra
status: complete
tags: [ecs, task-definition, environment, ssm, vitest, guard, env-example]
requires: []
provides:
  - "infra/modules/frontend-service/task-environment.json: { variables: [{ name, source: value | parameter, required, description }] }, 16 entries"
  - "apps/frontend/src/lib/server/startup/taskEnvironment.test.ts: helper taskEnvironmentProblems and the real-file case, override TASK_ENVIRONMENT_SPEC"
  - ".env.example: commented KEEP_ALIVE_TIMEOUT=65, HEADERS_TIMEOUT=66, SHUTDOWN_TIMEOUT=25 (Reverse proxy), DEPLOYMENT_DIAGNOSTICS=false (Debugging)"
  - "evidence/185-02-guard-red.md: red_missing_origin_exit=1, red_service_role_exit=1, green_exit=0"
affects: [185-04, infra/envs/staging/aws, infra/envs/example/aws, 185-14]
tech-stack:
  added: []
  patterns:
    - "The task environment is a JSON list in the module, so a Vitest guard can read what Terraform decodes (the hosted-settings.json precedent)"
    - "A real-file guard case with an environment-variable override of its input path, so a planted fault is seen failing on the real test path"
key-files:
  created:
    - infra/modules/frontend-service/task-environment.json
    - apps/frontend/src/lib/server/startup/taskEnvironment.test.ts
    - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-02-guard-red.md
    - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-02-tdd-red.json
  modified:
    - .env.example
decisions:
  - "The list's fields are name, source (value | parameter), required, description, as the plan states; PATTERNS.md's kind plain/secret wording is superseded"
  - "Every name ending in KEY, SECRET, PASSWORD or TOKEN must have source parameter, so PUBLIC_SUPABASE_ANON_KEY and ANALYTICS_POSTHOG_KEY are parameters"
  - "A list entry marked required that REQUIRED_ENV does not hold is a problem too, so the required set is exactly REQUIRED_ENV in both directions"
  - "The guard runs under @vitest-environment node, because the frontend's default jsdom environment replaces URL and fileURLToPath rejects it"
metrics:
  duration: "about 15 min"
  completed: 2026-11-12
estimate:
  tokens: 20000
  tasks: 2
actuals:
  tokens: 6900
  tasks: 2
  commits: 3
plan_head_before: 9e99a11392fef64366b4d980cb94b699eedf19f2
plan_head_after: b03a43c393410fb977b5725895268ba38f43d00e
---

# Phase 185 Plan 02: The frontend task's environment list and its guard Summary

The frontend task's environment is now one JSON list, `infra/modules/frontend-service/task-environment.json`, with 16 variables. Each has a source (`value`, set by the root, or `parameter`, read from the parameter store), a `required` flag and a description a deployer can act on. A Vitest guard ties the list to `REQUIRED_ENV`, `ANALYTICS_ENV` and the root `.env.example`. It refuses any `SERVICE_ROLE` name, and it refuses any secret-named variable whose source is not `parameter`. The guard was seen failing by name on the real test path: once for a missing `ORIGIN` and once for a planted `SUPABASE_SERVICE_ROLE_KEY`. Four new adapter-node and diagnostics variables are in `.env.example` as commented lines only.

## Tasks

| Task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 (RED) | Failing guard for the list | bafbdecb0 | apps/frontend/src/lib/server/startup/taskEnvironment.test.ts, evidence/185-02-tdd-red.json |
| 1 (GREEN) | The list and the commented `.env.example` lines | 641b685ec | infra/modules/frontend-service/task-environment.json, .env.example |
| 2 | The guard seen failing on the real test path | b03a43c39 | evidence/185-02-guard-red.md |

## What the list holds

In order: `PUBLIC_SUPABASE_URL` (value, required), `PUBLIC_SUPABASE_ANON_KEY` (parameter, required), `PUBLIC_PROJECT_ID` (value, required), `ORIGIN` (value, required), then these, not required: `ADDRESS_HEADER`, `XFF_DEPTH`, `KEEP_ALIVE_TIMEOUT`, `HEADERS_TIMEOUT`, `SHUTDOWN_TIMEOUT`, `PUBLIC_LOG_LEVEL`, `ANALYTICS_PROVIDER`, `ANALYTICS_CONSENT_MODE`, `ANALYTICS_VISIT_ID_MODE` and `ANALYTICS_POSTHOG_HOST` (all value), `ANALYTICS_POSTHOG_KEY` (parameter) and `DEPLOYMENT_DIAGNOSTICS` (value). No description names a deployment's value.

## What the guard checks

`taskEnvironmentProblems({ spec, envExample, requiredNames, analyticsNames })` returns one string per problem, and each string names its variable. It reports:

- the shape of the list and of each entry: a name, a source of `value` or `parameter`, a boolean `required` and a non-empty description
- a name listed twice
- a required name that is missing or not marked required, and an entry marked required that the start-up check does not require
- an analytics name that is missing
- a name that contains `SERVICE_ROLE`
- a secret-named variable whose source is not `parameter`
- a name that `.env.example` does not list, where a live `NAME=` line and a commented `# NAME=` line both count

Sixteen cases exercise the helper with fixtures. One case reads the real files, the list from `TASK_ENVIRONMENT_SPEC` or the module path and `.env.example` from the repository root, and expects no problem.

## TDD Gate Compliance

- RED: `bafbdecb0`. The target case "the task environment list in the repository > agrees with REQUIRED_ENV, ANALYTICS_ENV and .env.example" failed on its first assertion (`the list is expected at …/task-environment.json: expected false to be true`), while the 16 fixture cases passed. `gsd-tools check tdd-red-evidence` returned `RED_EVIDENCE_OK` (reason `target_test_failed`, TAP, 17 tests, 1 fail). Semantic assessment: the planned behaviour failed for the planned reason, the list did not exist yet, and there was no load, syntax or discovery fault. The record is `evidence/185-02-tdd-red.json`.
- GREEN: `641b685ec`. 17/17 pass.
- REFACTOR: none needed.
- Tracer gate: `<verify>` is automated only and the mode is end-of-phase, so it was re-run end to end. Both commands exited 0, so no checkpoint was raised.

## Verification

- `yarn workspace @openvaa/frontend test:unit src/lib/server/startup/taskEnvironment.test.ts`: exit 0, 17 passed.
- The node shape check (16 unique, fully described entries) and `yarn workspace @openvaa/dev-seed test:unit tests/deploymentTemplates.test.ts` both exit 0 (25 passed).
- Acceptance greps: `"SUPABASE_SERVICE_ROLE_KEY"` in the list: 0. Live lines for the four new names in `.env.example`: 0. Commented lines for them: 4 (baseline 0 and 0).
- Other readers of `.env.example`, all green: `analyticsEnvTemplates.test.ts` and `localSupabaseUrl.test.ts` (85 passed), `svelte.config.test.ts`, `vite.restartOnRootEnv.test.ts` and the startup directory (47 passed), and `node scripts/assert-env-pair-registry.mjs` (exit 0). ESLint and Prettier are clean on the new files.
- Task 2 record: `red_missing_origin_exit=1`, `red_service_role_exit=1`, `green_exit=0`. Each red run reported exactly one problem, and it named the planted variable.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The guard runs in the node environment**
- **Found during:** Task 1 (first RED run)
- **Issue:** The frontend's vitest config defaults to jsdom. Under jsdom, `new URL(..., import.meta.url)` is jsdom's URL, and `fileURLToPath` rejected it with "The URL must be of scheme file", so the whole file failed to load.
- **Fix:** I added `@vitest-environment node` to the specification block and put that block at the top of the file, as `src/lib/server/analytics/config.test.ts` does. In `requiredEnv.test.ts` the block sits after the imports.
- **Files modified:** apps/frontend/src/lib/server/startup/taskEnvironment.test.ts
- **Commit:** bafbdecb0

**2. [Process] An added RED evidence record**
- The task-level TDD protocol needs a classifier-checked RED record. It is committed as `evidence/185-02-tdd-red.json`, which is not in the plan's `files_modified`.

**3. [Rule 2 - Correctness] Two extra checks in the helper**
- Besides the cases the plan lists, the helper also reports an entry marked required that the start-up check does not require, and an entry without a name. Without the first, "required entries are exactly `REQUIRED_ENV`" would hold in one direction only. Each check has a fixture case.

## Known Stubs

None.

## Notes for later plans

- 185-04 builds the task definition from this list. The `source` field drives the split, `value` from the root's values and `parameter` as an ARN string under `/openvaa/<env>/frontend/<NAME>`. PATTERNS.md calls these `kind == "plain"` and `kind == "secret"`, but the field is now `source` with values `value` and `parameter`.
- The `.env.example` values (65 / 66 / 25) are commented examples, not settings. The staging root sets the real ones. `SHUTDOWN_TIMEOUT` must stay below the container's `stopTimeout` (30 s per D-16).
- The plan's flagged OBS-08 assumption is unchanged. The hosted observation reads a voter page with curl, so reads the browser makes after load are not observed there.

## Self-Check: PASSED

- FOUND: infra/modules/frontend-service/task-environment.json
- FOUND: apps/frontend/src/lib/server/startup/taskEnvironment.test.ts
- FOUND: evidence/185-02-guard-red.md
- FOUND: evidence/185-02-tdd-red.json
- FOUND: bafbdecb0, 641b685ec, b03a43c39 (each an ancestor of HEAD)
