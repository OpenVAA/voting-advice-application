---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 01
subsystem: infra
tags: [supabase, management-api, conformance-probe, vitest, node-builtins]

requires: []
provides:
  - "infra/scripts/probe-hosted.mjs: the probe entry (--root, PASS/FAIL/COULD NOT RUN, exit 0/1/2)"
  - "infra/scripts/probe/expected.mjs: readExpected, ProbeInputError, readTfvarsString, readPageSize, readMaxRows"
  - "infra/scripts/probe/sources.mjs: collect, SourceError, the management source (preflight + /postgrest max_rows)"
  - "infra/scripts/probe/checks.mjs: CHECKS, runChecks, pasteSafe; the check api.max-rows"
  - "infra/vitest.config.ts + root script test:unit:infra, chained into yarn test:unit and guarded by NON_WORKSPACE_SUITES"
affects: [184-02, 184-03, 184-17, 184-18, 184-19, 184-23]

actuals:
  tokens: 8500
  tasks: 2
  commits: 2
plan_head_before: 9b67a4abd2e5882e268bc5f92fe1ea6f67b58260
plan_head_after: 7e84a319b5877c88c2f73638872655be81e8454c

tech-stack:
  added: []
  patterns:
    - "Probe modules free of top-level side effects; only the entry has them"
    - "Preflight every source before any read; a source error is one COULD NOT RUN line and exit 2, no check line"
    - "Named-field extraction at read time: a response body is parsed, named fields copied, body dropped"
    - "Every stdout line passes the paste screen (no =, @, 32+ hex run, secret word followed by : or =)"
    - "process.exitCode = 2 set first, so any exit other than a completed run is could-not-run"

key-files:
  created:
    - infra/scripts/probe-hosted.mjs
    - infra/scripts/probe/expected.mjs
    - infra/scripts/probe/sources.mjs
    - infra/scripts/probe/checks.mjs
    - infra/scripts/probe-hosted.test.ts
    - infra/vitest.config.ts
  modified:
    - package.json
    - scripts/assert-unit-test-coverage.mjs

key-decisions:
  - "collect preflights every requested source first, then reads each: all sources must answer before any check runs"
  - "responses shape is grouped by endpoint: { management: { postgrest: { max_rows } } }"
  - "runChecks replaces a finding that fails pasteSafe with a fixed withheld line; the entry does the same for a COULD NOT RUN reason"
  - "Requests are GET with redirect manual and a 30 s timeout; a redirect or timeout is a SourceError, never a followed request"

patterns-established:
  - "Adding a check: append { name, source, run } to CHECKS; add its expected values to readExpected and its named fields to the source's read"
  - "Spec runs the entry with spawn (async) and a minimal env { PATH, PROBE_MANAGEMENT_API_URL, ... } so no shell token reaches the child"

requirements-completed: []

coverage:
  - id: D1
    description: "api.max-rows runs end to end from tracked files through the Management API reader to a printed verdict and exit status"
    requirement: "SUPA-07"
    verification:
      - kind: unit
        ref: "infra/scripts/probe-hosted.test.ts#probe-hosted.mjs"
        status: pass
    human_judgment: false
  - id: D2
    description: "A source that fails its preflight, an unset token, a missing tfvars or a usage error exits 2 with no PASS/FAIL line"
    requirement: "SUPA-07"
    verification:
      - kind: unit
        ref: "infra/scripts/probe-hosted.test.ts#exits 2 with COULD NOT RUN and no check line when the preflight answers 503"
        status: pass
    human_judgment: false
  - id: D3
    description: "A served jwt_secret never reaches stdout or stderr, and every stdout line passes the paste screen"
    requirement: "SUPA-03"
    verification:
      - kind: unit
        ref: "infra/scripts/probe-hosted.test.ts#expectNoSecret (every entry case)"
        status: pass
    human_judgment: false
  - id: D4
    description: "yarn test:unit runs the infra suite through test:unit:infra, guarded by assert-unit-test-coverage Check 3"
    verification:
      - kind: other
        ref: "node scripts/assert-unit-test-coverage.mjs"
        status: pass
    human_judgment: false

duration: 6min
completed: 2026-10-26
status: complete
---

# Phase 184 Plan 01: Conformance probe tracer (api.max-rows) Summary

**The hosted conformance probe runs one check, `api.max-rows`, through every layer it will have: the expected value comes from `hosted-settings.json` and `pageSize`, the served value from a preflighted Management API reader that keeps only `max_rows`, and the result is a `PASS`/`FAIL`/`COULD NOT RUN` line with exit 0/1/2. A 17-test Vitest suite proves it against a stub server on 127.0.0.1, and `yarn test:unit` now runs that suite.**

## Performance

- **Duration:** about 6 min
- **Started:** 2026-10-26T12:45:20Z
- **Completed:** 2026-10-26T12:51Z
- **Tasks:** 2
- **Files modified:** 8 (6 created, 2 modified)

## Accomplishments

- One check runs end to end from tracked files to a printed verdict and exit status. The spec proves pass (exit 0, stdout exactly `PASS api.max-rows`), fail (exit 1) and could-not-run (exit 2, no check line).
- The spec asserts that a stub `jwt_secret` and the test token never appear in stdout or stderr, and that every stdout line passes an independent copy of the paste-screen rules.
- The infra suite is a declared, chained and guarded part of `yarn test:unit`.

## Module interfaces (for 184-02 and 184-03 to extend)

- **`infra/scripts/probe/expected.mjs`**
  - `REPO_ROOT`: three levels above `infra/scripts/probe/`.
  - `EXPECTED_PATHS = { settings, staticSettings }`: paths relative to the repository root.
  - `class ProbeInputError extends Error { file, what }`. Its message is `<file>: <what>`, with `file` relative to the repository root when it is inside it.
  - `readExpected({ repoRoot = REPO_ROOT, root })` returns `{ ref, maxRows: { json, pageSize } }`. `root` is absolute (the entry resolves it).
  - The line-read helpers are exported for reuse:
    - `readTfvarsString(file, text, name)` returns the value, or `null` when the name is not assigned. It throws when the name is assigned twice or a line cannot be read.
    - `readPageSize(file, text)`.
    - `readMaxRows(file, text)`.
- **`infra/scripts/probe/sources.mjs`**
  - `DEFAULT_MANAGEMENT_API_URL`, `SOURCE_NAMES`.
  - `class SourceError extends Error { source, reason }`. The reason names the endpoint path and the status only, for example `GET /v1/projects/<ref> answered 503` or `... did not answer (ECONNREFUSED)`.
  - `collect({ sources, expected, env = process.env, fetchImpl = fetch })` runs in three steps:
    1. `setup` for each source: validates the environment (`SUPABASE_ACCESS_TOKEN`; the base is `PROBE_MANAGEMENT_API_URL` or `https://api.supabase.com`).
    2. `preflight` for each source: `GET /v1/projects/{ref}` must answer 200.
    3. `read` for each source.

    It returns `{ management: { postgrest: { max_rows } } }`.
  - A new source is a new key of the internal `SOURCES` map with `setup`/`preflight`/`read`. `getJson({ ..., fields })` keeps only the named fields, and a missing field is a `SourceError`.
- **`infra/scripts/probe/checks.mjs`**
  - `CHECKS: Array<{ name, source, run(expected, responses) -> { pass: true } | { pass: false, finding } }>`.
  - `runChecks(expected, responses)` returns `[{ name, pass, finding|null }]` in registry order.
  - `pasteSafe(line)`.
- **`infra/scripts/probe-hosted.mjs`**
  - The only file with side effects; nothing imports it. Flags: `--root <dir>` (required; a relative path is resolved against the repository root) and `-h`/`--help`.
  - It collects only the sources that some registered check names. A registry with no checks gives COULD NOT RUN.
  - Check lines go to stdout; the one summary line goes to stderr.

## Task Commits

1. **Task 1: The probe end to end for one check, `api.max-rows`**: `068c7273f` (feat)
2. **Task 2: Run the infra suite from `yarn test:unit`**: `7e84a319b` (chore)

## Files Created/Modified

- `infra/scripts/probe-hosted.mjs`: the entry. It holds the header (sources, checks, environment, exit codes, never the service-role key), parses the arguments, runs the cascade guard and prints.
- `infra/scripts/probe/expected.mjs`: reads the expected values from tracked files only.
- `infra/scripts/probe/sources.mjs`: the Management API reader, with preflight and named-field extraction.
- `infra/scripts/probe/checks.mjs`: the check registry, `api.max-rows` and the paste screen.
- `infra/scripts/probe-hosted.test.ts`: 17 tests. The pure comparisons, `readExpected`, and the entry run as a child process against a stub server.
- `infra/vitest.config.ts`: the non-workspace Vitest suite of `infra/`.
- `package.json`: adds `test:unit:infra` and the `&& yarn test:unit:infra` link.
- `scripts/assert-unit-test-coverage.mjs`: adds the `NON_WORKSPACE_SUITES` entry for `infra/vitest.config.ts`.

## Decisions Made

- **All preflights before any read.** `collect` sets up and preflights every requested source before reading any of them, following the research's cascade-guard pattern. This satisfies "preflight before any read of that source" and also keeps one source's failure from leaving another half-read.
- **Requests cannot be redirected and cannot hang.** Every request is a GET with `redirect: 'manual'` and a 30 s timeout. A 3xx or a timeout is a `SourceError`, so the bearer token is never forwarded and a hung source gives exit 2.
- **Unsafe text is withheld, not printed.** A finding or reason that fails `pasteSafe` is replaced with a fixed "withheld" line.
- **Non-numbers are described, not shown.** A served value that is not a number is described by its JSON type alone and never printed.
- **The default status is "could not run".** The entry sets `process.exitCode = 2` first and overrides it only when a run completes. An unexpected exception is caught as `COULD NOT RUN probe: ...` with exit 2.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Hardening of the source reader and the entry beyond the plan's text**
- **Found during:** Task 1
- **Issue:** The plan did not cover three ways the probe could leak or mislead:
  - a redirect, which could carry the bearer header elsewhere;
  - a hung request, which could stall the probe indefinitely;
  - an output line that fails the screen, which would reach stdout as is.
- **Fix:** Added `redirect: 'manual'` and `AbortSignal.timeout`, a paste-screen fallback in both `runChecks` and `couldNotRun`, and a default exit status of 2.
- **Files modified:** `infra/scripts/probe/sources.mjs`, `infra/scripts/probe/checks.mjs`, `infra/scripts/probe-hosted.mjs`
- **Commit:** `068c7273f`

**2. [Rule 3 - Lint] stdout through `process.stdout.write`**
- **Found during:** Task 1
- **Issue:** The shared ESLint config forbids `console.log`. ESLint is not run over `infra/` by any gate, but the files were linted clean anyway.
- **Fix:** The entry writes stdout lines through `process.stdout.write`. The test helpers became function declarations (`func-style`).
- **Commit:** `068c7273f`

**Total deviations:** 2 auto-fixed (1 missing critical, 1 lint).
**Impact on plan:** None on the interfaces. Both are additive hardening.

## Issues Encountered

- A full `yarn test:unit` run, done as an extra check, was red in `@openvaa/dev-seed` integration while a `-gsd` E2E run restarted the shared stack. Root cause UNCONFIRMED; see Verification and `deferred-items.md`. The plan's own gates are all green.

## Verification

- `node_modules/.bin/vitest run --config infra/vitest.config.ts`: exit 0, 17 passed (the plan requires at least 9).
- `node infra/scripts/probe-hosted.mjs` and `... --root infra/envs/staging/supabase --bogus`: each exits 2.
- `node scripts/assert-unit-test-coverage.mjs`: exit 0, Check 3 names 2 suites.
- `yarn test:unit:infra && prettier --check package.json`: exit 0.
- The acceptance greps all hold:
  - `PROBE_MANAGEMENT_API_URL` 2 in `sources.mjs`, `'api.max-rows'` 1 in `checks.mjs`.
  - `COULD NOT RUN` 3 and `service-role` 1 in the entry, and its probe imports 3.
  - `spawnSync` 0 in the spec.
  - The package.json `node -e` check exits 0.
- Full `yarn test:unit` (run as an extra check, not a plan gate): **exit 1, not a clean signal.**
  - Results: 24 of 25 turbo tasks green, and the frontend at 5948 passed. `@openvaa/dev-seed` failed 2 tests in `tests/integration/default-template.integration.test.ts`: `bulkImport failed: Nomination constituency … is no constituency of its election`, then `anon-visible candidate nominations: expected 0`. The chain stopped at the turbo link, so `test:unit:infra` was not reached in this run; it is green when run on its own.
  - Concurrent activity: the run overlapped an E2E run from the `-gsd` worktree (`tests/e2e-runs/179.1-e2e/179.1-05-red`), which restarted the shared local Supabase stack (`yarn db:start` in -gsd, containers "Up 8–20 seconds" right after the failure).
  - Root cause: **UNCONFIRMED** (concurrent churn on the shared stack is likely; not tested in isolation). This plan touches no dev-seed, database or frontend file. The test was not rerun, so as not to disturb the -gsd run in flight. It is logged in `deferred-items.md`.

## User Setup Required

None. The probe contacts no hosted project until an operator runs it with `SUPABASE_ACCESS_TOKEN` (the live runs are later plans).

## Next Phase Readiness

184-02 and 184-03 add checks and sources to the shapes listed above. The `prohibitions` item (never take, read or print the service-role key, and never print a secret-named field) is held by construction here: no code path reads such a variable, and only named fields are kept. Each later source must keep that property.

---
*Phase: 184-hosted-supabase-measurement-and-conformance-probe*
*Completed: 2026-10-26*

## Self-Check: PASSED

All six created files exist; commits 068c7273f and 7e84a319b are ancestors of HEAD.
