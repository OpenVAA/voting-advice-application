---
phase: 181-deployability-and-migration-model
plan: 04
subsystem: infra
tags: [sveltekit, adapter-node, health-check, docker, turbo, build-id, vitest]

# Dependency graph
requires:
  - phase: 181-01
    provides: node_modules installed under Node 24.21.0, and the rule that a turbo gate is read beside its Cached line
  - phase: 181-03
    provides: the whole-suite count of the frontend unit tests before this plan (3599 passed, 20 skipped), and the RED-evidence method (a skeleton beside the failing test, the JUnit reporter)
provides:
  - GET /api/health, answering 200 with { status, build } and cache-control no-store, with no argument and no upstream
  - kit.version.name read from BUILD_SHA in apps/frontend/svelte.config.js, undefined for an unset or empty value
  - the Docker build argument and environment variable BUILD_SHA in the production stage of apps/frontend/Dockerfile
  - the exec-form CMD of the production image
  - env BUILD_SHA in the turbo hash of the frontend build task
affects: [181-09, 181-13, 181-14, 185, 186, 187]

# Actuals (#2632)
# tokens is chars/4 over the diff plan_head_before..plan_head_after (9661 characters, six files).
# commits is measured when this summary was written: git rev-list --count plan_head_before..HEAD.
# The commit of this summary and the state commit come after it and are not in the count.
actuals:
  tokens: 2415
  tasks: 2
  commits: 4
plan_head_before: 9b1121aed1acf9bd6c362f1803ccda5b78bb4555
plan_head_after: 78927206966b0c92760974d45d2fe4f9a4cf2aca

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A handler that must not depend on an upstream takes no event, and its test passes an event whose forbidden members throw when read"
    - "A case that reads a module-load-time environment variable sets the variable, calls vi.resetModules() and imports the module again"
    - "A build-time variable is declared in the env of its turbo task, so the cache key follows it"

key-files:
  created:
    - apps/frontend/src/routes/api/health/+server.ts
    - apps/frontend/src/routes/api/health/server.test.ts
  modified:
    - apps/frontend/svelte.config.js
    - apps/frontend/svelte.config.test.ts
    - apps/frontend/Dockerfile
    - apps/frontend/turbo.json

key-decisions:
  - "181-04: the health handler is declared with no parameter. The test calls it through a const typed as kit's RequestHandler, which is how the server calls it, so the event it passes type-checks against a handler that takes none."
  - "181-04: the trap is on reading the member, not on calling it. The event's locals and getClientAddress are getters that throw and name themselves; two control cases show each trap throws."
  - "181-04: the empty-string case of kit.version.name passes before the implementation, so it was shown to fail in a control run against name: process.env.BUILD_SHA (expected '' to be undefined) before the final form was written."
  - "181-04: ENV BUILD_SHA follows the Dockerfile's own ARG then ENV pair, so the variable is also in the environment of the running container, empty when no argument was given."
  - "181-04: the frontend type check was run although the plan does not order it. It exited 0 with 0 errors and 0 warnings over 2817 files. It reads src/** and so also the files of plan 181-03; it does not read svelte.config.js or svelte.config.test.ts."

patterns-established:
  - "The health answer carries the build id from the version export of $app/environment, which is kit.version.name: one value at /api/health and at /_app/version.json"
  - "An empty build argument is turned into undefined where the config reads it, not in the Dockerfile"

# The plan's frontmatter lists SUPA-10 as the phase's closing requirement, and the template orders the
# list to be copied. This plan closes nothing: SUPA-10 is NOT closed and was not marked complete
# (requirements.ready-ids answered "0/1 requirement(s) ready to mark complete").
requirements-completed: [SUPA-10]

coverage:
  - id: D1
    description: "GET /api/health answers 200 with exactly { status: 'ok', build } and cache-control: no-store, and completes for an event whose locals and getClientAddress throw when read"
    verification:
      - kind: unit
        ref: "apps/frontend/src/routes/api/health/server.test.ts (6 tests)"
        status: pass
    human_judgment: false
  - id: D2
    description: "kit.version.name is the BUILD_SHA the build was given and is undefined when the variable is unset or empty; the poll interval is the same in all three cases"
    verification:
      - kind: unit
        ref: "apps/frontend/svelte.config.test.ts, block 'svelte.config.js — kit.version.name' (6 tests)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The production stage of the Dockerfile declares the BUILD_SHA build argument above the build step and starts Node with an exec-form CMD"
    verification:
      - kind: other
        ref: "Task 2 <verify><automated> of 181-04-PLAN.md, run verbatim: exit 0 (both greps over the Dockerfile; ciDockerImageBuildGate.test.ts passes)"
        status: pass
    human_judgment: true
    rationale: "Only the text of the Dockerfile was checked. No image was built, so that the build argument reaches the build and that Node is the container's first process and receives SIGTERM are not observed here. Plans 181-13 and 181-14 observe them."
  - id: D4
    description: "The frontend build task of turbo hashes BUILD_SHA, with its inputs and outputs unchanged"
    verification:
      - kind: unit
        ref: "packages/dev-seed/tests/turboBuildInputsGate.test.ts (passes; with ciDockerImageBuildGate.test.ts 17 tests)"
        status: pass
      - kind: other
        ref: "turbo run build --dry=json --filter=@openvaa/frontend with BUILD_SHA unset, abc1234, def5678, abc1234: three different hashes, the same hash for the same value; before the change the hash was the same with and without the variable"
        status: pass
    human_judgment: false

# Metrics
duration: 6min
completed: 2026-10-12
status: complete
---

# Phase 181 Plan 04: Health Route, Build Id and Exec-Form CMD Summary

**`GET /api/health` answers 200 with a status and the build id without taking the request event, `kit.version.name` follows the `BUILD_SHA` given to the build and stays time-based for an unset or empty value, and the production image declares that build argument and starts Node with an exec-form `CMD`. All of it is unit-level and text-level: no image was built, no server was started, and the health route was not called over HTTP.**

## Performance

- **Duration:** 6 min
- **Started:** 2026-10-12T17:21:30Z
- **Completed:** 2026-10-12T17:27:12Z
- **Tasks:** 2 of 2
- **Files modified:** 6 (2 new, 4 changed)

## Accomplishments

- `apps/frontend/src/routes/api/health/+server.ts` exports `GET`, declared with no parameter. It answers `json({ status: 'ok', build: version }, { headers: { 'cache-control': 'no-store' } })`, with `version` imported from `$app/environment`. The file contains neither the identifier `locals` nor `getClientAddress`.
- `apps/frontend/svelte.config.js` has `name: process.env.BUILD_SHA || undefined` in the `version` block, above the unchanged `pollInterval`, with a comment that says what the coercion prevents.
- `apps/frontend/Dockerfile`, production stage only: `ARG BUILD_SHA=""` and `ENV BUILD_SHA=${BUILD_SHA}` between the `NODE_ENV` pair and `WORKDIR /opt`, so above `RUN yarn workspace @openvaa/frontend build`; the last line is `CMD ["node", "./apps/frontend/build/index.js"]`. The stage name, `EXPOSE 3000` and the development stage's `CMD` are unchanged.
- `apps/frontend/turbo.json`: the `build` task has `"env": ["BUILD_SHA"]`; `inputs` and `outputs` are unchanged.

## Recorded statuses

Every status was read from `$?` of the command itself, with the output sent to a file under `tmp/181-04/`. No command was read through a pipe.

| Check | Command | Status |
|-------|---------|--------|
| Task 1 verify | `yarn workspace @openvaa/frontend test:unit src/routes/api/health/server.test.ts` | 0 (1 file, 6 passed) |
| Task 2 verify | the plan's chained command, verbatim: the two frontend test files, the two dev-seed gate specs, the two greps over the Dockerfile | 0 (frontend: 2 files, 16 passed; dev-seed: 2 files, 17 passed) |
| Whole frontend suite | `yarn workspace @openvaa/frontend test:unit`, on commit `789272069` with no uncommitted tracked change | 0 (197 files passed, 1 skipped; 3611 tests passed, 20 skipped) |
| Frontend type check | `yarn workspace @openvaa/frontend typecheck`, on commit `789272069` | 0 (`COMPLETED 2817 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`) |
| eslint, health directory | `yarn workspace @openvaa/frontend exec eslint src/routes/api/health` | 0 |
| prettier | `yarn prettier --check` over the health directory, `svelte.config.js`, `svelte.config.test.ts`, `turbo.json` | 0 |
| Comment hygiene | `node scripts/assert-comment-hygiene.mjs` | 0 (0 violations) |
| eslint, `svelte.config.js` | `yarn workspace @openvaa/frontend exec eslint svelte.config.js` | **1**: `simple-import-sort/imports` on the import lines, which this plan did not change |
| eslint, `svelte.config.test.ts` | `yarn workspace @openvaa/frontend exec eslint svelte.config.test.ts` | **1**: `func-style` on `const strip = …` in the `kit.env.dir` block, which this plan did not change |

The whole-suite count is the count of plan 181-03 (3599 passed, 20 skipped) plus the 12 tests this plan adds. None of these commands goes through turbo's cache: the per-workspace commands call Vitest, eslint and svelte-check directly, and the dry runs read no cache.

The two eslint findings are on lines that were in the files before the plan. The frontend's `lint` script is `eslint src/`, so no gate reads either file. They are recorded in `deferred-items.md` and were not fixed.

**The type check does not read the two config files.** Its include list is `src/**`, `tests/**`, `test/**` and the Vite config. So the new cases in `svelte.config.test.ts` have passed Vitest and prettier and no compiler; the health route and its test have passed the type check.

**Not run:** `yarn build`, an image build, `yarn test:unit` at the root, the whole-workspace lint, any `supabase`, `yarn db:*` or `yarn dev*` command. No database and no Docker command was run.

### The turbo hash, before and after

Read with `turbo run build --dry=json --filter=@openvaa/frontend` (turbo 2.11.4), the remote-cache variables removed from the environment. A dry run builds nothing.

| Tree | `BUILD_SHA` | Hash of `@openvaa/frontend#build` | `resolvedTaskDefinition.env` |
|------|-------------|-----------------------------------|------------------------------|
| before the change (`c1a73e8a9`) | unset | `a326883b96dbe16b` | `[]` |
| before the change | `abc1234` | `a326883b96dbe16b` | `[]` |
| after the change (working tree of `789272069`) | unset | `246c68525b1044db` | `["BUILD_SHA"]` |
| after the change | `abc1234` | `001a9fcf5e43cf88` | `["BUILD_SHA"]` |
| after the change | `def5678` | `f9e780a1afbd282a` | `["BUILD_SHA"]` |
| after the change | `abc1234` again | `001a9fcf5e43cf88` | `["BUILD_SHA"]` |

Before the change a build made for one commit would have been replayed for another. After it the hash follows the value. `dependsOn` is still `["^build"]`.

## Task Commits

1. **Task 1: The health route**
   - `6c4ab1bca` (test): the failing test and a skeleton of the route that answers 501
   - `4a685ef5e` (feat): the handler
2. **Task 2: The build id from a build argument, and the exec-form CMD**
   - `c1a73e8a9` (test): the failing test, in a new `describe` block of `svelte.config.test.ts`
   - `789272069` (feat): `kit.version.name`, the Dockerfile, the turbo task

## RED evidence

Both RED records were passed to `gsd-tools check tdd-red-evidence` and both returned `RED_EVIDENCE_OK` (`target_test_failed`). The reports were taken with `--reporter=junit --outputFile=<path under tmp/181-04/>` and were not edited. The records are under `tmp/181-04/` (ignored by git).

| Task | Target test | Result of the RED run | Semantic assessment |
|------|-------------|-----------------------|---------------------|
| 1 | `GET /api/health > answers 200` | exit 1; 6 tests, 4 failed, 2 passed | The target ran and failed on its own `toBe(200)` (`expected 501 to be 200`). All four failures are assertion failures: status, body (`expected {} to strictly equal { status: 'ok', build: 'test' }`), header (`expected null to be 'no-store'`), and the status of the trapped event. The two that passed are the control cases, which assert that the test's own trapped event throws; they hold with no handler. |
| 2 | `svelte.config.js — kit.version.name > is the BUILD_SHA the build was given` | exit 1; 10 tests, 1 failed, 9 passed | The target ran and failed on its own `toBe` (`expected undefined to be 'abc1234'`). The config module exists and was imported again after `vi.resetModules()`, so there is no load fault. Five of the six new cases pass before the implementation: a config with no name already has an undefined name and an unchanged poll interval. They constrain how the name is added. See the control run below. |

**Control run for the empty-string case (Task 2).** Before the final form was written, the config was given `name: process.env.BUILD_SHA`, with no coercion, and the same test file was run: exit 1, 10 tests, 1 failed, and the failure was `svelte.config.js — kit.version.name > is undefined, not the empty string, when BUILD_SHA is empty` with `expected '' to be undefined`. So the case fails for the defect it is written against. The naive form was never committed.

## Files Created/Modified

- `apps/frontend/src/routes/api/health/+server.ts` - the `GET` handler; imports `json` and `version`
- `apps/frontend/src/routes/api/health/server.test.ts` - 6 cases: status, exact body, `cache-control`, the trapped event, and one control case for each trapped member
- `apps/frontend/svelte.config.js` - `name: process.env.BUILD_SHA || undefined` and its comment
- `apps/frontend/svelte.config.test.ts` - `afterEach` and `vi` added to the Vitest import, and the block `svelte.config.js — kit.version.name` with 6 cases; the `kit.env.dir` block is unchanged
- `apps/frontend/Dockerfile` - the `BUILD_SHA` pair with a one-line comment, the exec-form `CMD` with a one-line comment, and a newline at the end of the file, which had none
- `apps/frontend/turbo.json` - `"env": ["BUILD_SHA"]` on the `build` task

## Decisions Made

- **The handler takes no parameter.** The plan allows "no argument, or ignores its event". With no parameter there is nothing in the file that could reach `locals` or the client address, and the acceptance criterion on the two identifiers holds by construction.
- **The test calls the handler through `RequestHandler`.** `const handler: RequestHandler = GET;` type-checks, because a function with fewer parameters is assignable, and lets the test pass an event the way the server does. The plan's pattern file casts the event through `Parameters<typeof POST>[0]`; for a handler with no parameter that type is `undefined`, so the event is cast to `Parameters<RequestHandler>[0]` instead.
- **Reading a trapped member throws.** `locals` and `getClientAddress` are enumerable getters on the event that throw an error naming the member. That is stricter than a function that throws when called: destructuring or spreading the event fails too.
- **Three cases use a harmless event and one uses the trapped event.** A handler that touched a trapped member would otherwise fail every case, and the failure would not say which behaviour broke.
- **`it.each` for the poll interval**, over set, unset and empty, each importing the config again.
- **The variable is restored after each case** to the value it had when the test file was loaded, and the module registry is reset again, so no later test file sees a config evaluated with a test value.
- **A newline was added at the end of the Dockerfile.** The last line had none.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The RED commit of Task 1 holds a skeleton of the route**
- **Found during:** Task 1
- **Issue:** The plan says to write the test first and see it fail. With no `+server.ts`, the test fails while importing it, which the TDD reference counts as an invalid RED. The dispatch prompt orders a behaviour-free skeleton beside the failing test.
- **Fix:** `6c4ab1bca` adds a `+server.ts` whose `GET` answers `json({}, { status: 501 })`. The body is an empty object and not an empty response, so the body case fails on its assertion and not while parsing. The handler is in `4a685ef5e`.
- **Files modified:** `apps/frontend/src/routes/api/health/+server.ts`
- **Verification:** `RED_EVIDENCE_OK`; all four failures are assertion failures
- **Committed in:** `6c4ab1bca`

Task 2 needed no skeleton: the module under test, `svelte.config.js`, exists.

### Checks added to the plan's verify commands

These changed no tracked file.

- The control run for the empty-string case, described under "RED evidence".
- The turbo dry runs before and after the change, in the table above. The gate spec `turboBuildInputsGate.test.ts` does not assert the `env` key, so without them nothing would show that the hash follows the variable.
- The whole frontend suite and the frontend type check, both on the last task commit.

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** none on what was built. One short-lived skeleton is in the history.

## Issues Encountered

- **Two eslint findings on lines the plan did not write**, in `svelte.config.js` and `svelte.config.test.ts`. Both files are outside the frontend's lint scope. Recorded in `deferred-items.md`, not fixed.

## What a later plan must know

- **Nothing here was observed on a built server or in an image.** The unit test shows that the handler itself reads nothing from the event. It does not run the hooks: `supabaseHandle` and the Paraglide handle still run for `/api/health` on a real request. That the route answers 200 with Supabase unreachable is plan 181-09's observation.
- **The health body is `{ status: 'ok', build }`.** `build` is the `version` export of `$app/environment`, which is `kit.version.name`. With `BUILD_SHA` given to the build it is that value. With none it is kit's default, the build's `Date.now()` as a string of digits, so a check of a build made without the argument should expect a number-like string and not `undefined` or an empty string. In unit tests the stub gives `'test'`.
- **`BUILD_SHA` is read when `svelte.config.js` is evaluated**, so it must be in the environment of the process that runs `vite build`. It is not read at run time: setting it on a container built without it changes nothing in the served build id.
- **The running container has `BUILD_SHA` in its environment**, because the Dockerfile's `ENV` line persists; it is an empty string when no build argument was given. The served build id still comes from the build, not from that variable.
- **Inferred from reading the Dockerfile, not observed:** the `shared` stage runs `yarn build`, which is turbo over every workspace and so builds the frontend once without `BUILD_SHA`, since the argument is declared in the `production` stage only. The `production` stage then runs `yarn workspace @openvaa/frontend build` directly, without turbo, with the variable set. If that second build did not replace the first one's output, the image would serve a time-based id. Plan 181-13 should read `/_app/version.json` or `/api/health` from an image built with `--build-arg BUILD_SHA=<sha>` and compare.
- **Turbo passes `BUILD_SHA` to the frontend build task now.** A `yarn build` with the variable set in the shell misses the cache of a build made without it, and the other way round.
- **`BUILD_SHA` and `/api/health` are in no template and no document yet.** This plan's file list holds neither `.env.example`, the compose files, `render.example.yaml` nor the guides. `apps/docs/.../developers-guide/deployment/+page.md` shows the start command as `node apps/frontend/build/index.js`, which is still correct outside the image.
- **The frontend type check is green on `789272069`**: 0 errors and 0 warnings over 2817 files. This is the first compiler run over the files of plan 181-03 as well. It does not cover `svelte.config.js` or `svelte.config.test.ts`.
- **`SIGTERM` is not observed.** The exec form makes Node the first process by Docker's documented rule. Whether the process then exits after draining is plan 181-14's measurement.

## Known Stubs

None. The skeleton of the RED commit was replaced in `4a685ef5e`.

## User Setup Required

None.

## Next Phase Readiness

- Plans 181-09 and 181-13 can call `/api/health` and pass `BUILD_SHA` as described above.
- Not closed here: SUPA-10 stays open until the last plan of the phase. INFRA-04, INFRA-09 and PIPE-07 are built toward and closed by phases 185 and 187.

## Self-Check: PASSED

- The six files of the plan exist.
- Commits `6c4ab1bca`, `4a685ef5e`, `c1a73e8a9` and `789272069` are ancestors of `HEAD`.
- `commits: 4` is `git rev-list --count 9b1121aed..HEAD` at the time of writing, with `HEAD` at `789272069`.
- A `test(181-04)` commit precedes the `feat(181-04)` commit of each task.
- Every acceptance criterion of the two tasks was checked by command after the last task commit; all hold. For Task 2: the `ARG BUILD_SHA` line is at line 51, between `FROM frontend AS production` (45) and the build step (56); the last non-empty line is the `CMD [` line; `turbo.json` parses and its `build` task is `{ inputs, outputs, env: ["BUILD_SHA"] }` with the two older keys as before.
- The plan-level verification holds: the health and config test files pass, the two dev-seed gate specs pass, the Dockerfile's last line is the JSON-array `CMD`, and `BUILD_SHA` is declared in the production stage.
- No stub pattern was found in the files this plan created or changed.

---
*Phase: 181-deployability-and-migration-model*
*Completed: 2026-10-12*
