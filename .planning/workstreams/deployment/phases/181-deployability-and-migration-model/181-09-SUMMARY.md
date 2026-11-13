---
phase: 181-deployability-and-migration-model
plan: 09
subsystem: infra
tags: [sveltekit, adapter-node, health-check, environment, build-id, diagnostics, evidence]

# Dependency graph
requires:
  - phase: 181-03
    provides: the init export of hooks.server.ts and missingRequiredEnv, and GET /api/diagnostics
  - phase: 181-04
    provides: GET /api/health, kit.version.name from BUILD_SHA, and BUILD_SHA in the turbo hash of the frontend build
  - phase: 181-01
    provides: node_modules under Node 24.21.0 and the rule that a recorded turbo gate uses a private cache
provides:
  - evidence/181-09-production-start.md, the observations of criteria 1 and 2 (first half) on the built server, each with its control
  - the measurement of research assumption A6 (a production start whose init throws exits 1 before it listens)
  - the measurement of research assumption A13 (the health route reaches no upstream; constructing the server client makes no network call for a request without cookies)
  - the first type check and the first build after plans 181-03 and 181-04
affects: [181-13, 181-14, 181-15, 185]

# Actuals (#2632)
# tokens is chars/4 over the diff plan_head_before..plan_head_after (30030 characters, one file).
# commits is measured when this summary was written: git rev-list --count plan_head_before..HEAD.
# The commit of this summary and the state commit come after it and are not in the count.
actuals:
  tokens: 7508
  tasks: 2
  commits: 2
plan_head_before: fafaada0d1686f8bef1935c8c3d72f8de6a51c8c
plan_head_after: 778d6f3b0f73ec49a87487a931fff076723c8884

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A start of the built server is made through env -i with PATH, HOME and the named variables only, so a variable is removed by not writing it"
    - "A process's exit status is taken with wait on the pid the run started; a process that had to be stopped has no recorded status"
    - "Readiness is read with lsof on the started pid, so no HTTP request precedes the observation"
    - "A stand-in for the Supabase API sends access-control-allow-origin, which kit's server-side fetch of a universal load requires of a cross-origin answer"

key-files:
  created:
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-09-production-start.md
  modified:
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/deferred-items.md

key-decisions:
  - "181-09: research assumptions A6 and A13 both held on the built server, so apps/frontend/src/hooks.server.ts was not edited."
  - "181-09: the counting stub was given one added rule, access-control-allow-origin on every answer. It is the one adaptation the plan allows, used once with the control repeated once, but it is a header on every answer where the plan describes a body for one path. Without it nothing discriminates. The verifier decides whether that reading stands."
  - "181-09: the upstream discriminator is the number of upstream answers kit inlines into the page (data-sveltekit-fetched): 6 with the stub, 0 with the upstream refusing. The page's status is 200 in both cases."
  - "181-09: in the quoted standard error the absolute path of the repository is written <repo>. Nothing else in a quoted output is changed."

patterns-established:
  - "The record of an observation says how the observed process's environment was constructed and what, in the process's own behaviour, shows it"

# The plan's frontmatter lists SUPA-10 as the phase's closing requirement, and the template orders the
# list to be copied. This plan closes nothing: SUPA-10 is NOT closed and was not marked complete
# (requirements.ready-ids answered "0/1 requirement(s) ready to mark complete").
requirements-completed: [SUPA-10]

coverage:
  - id: D1
    description: "A production start of the built server with a required variable not given exits 1 with one error naming exactly that variable, for each of the four, and names both when two are not given; with all four set it listens and the health route answers 200"
    verification:
      - kind: other
        ref: "Task 1 <verify><automated> of 181-09-PLAN.md, run verbatim after each of the two task commits: exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "The health route of the production build makes no request to the upstream (a counting stub sees none from it and six from a page's root load), and answers 200 with the upstream refusing while that page answers differently by a recorded discriminator"
    verification:
      - kind: other
        ref: "Task 2 <verify><automated> of 181-09-PLAN.md, run verbatim: exit 0"
        status: pass
    human_judgment: true
    rationale: "The control rests on one adaptation of the stub: access-control-allow-origin on every answer. The plan allows one adaptation and describes it as a rule for one path. With the stub exactly as the plan lists it the three values are 200, 0 and 7 both with the stub and with the upstream refusing, so nothing would have discriminated. The adaptation was made on the stub's log before any refused-upstream request, and its cause was read in kit's source and confirmed by the repeat. Whether that reading of the allowed adaptation stands is for the verifier or the operator."
  - id: D3
    description: "A build made with BUILD_SHA serves that sha at /api/health and /_app/version.json; a build made without it serves a time-based number at both"
    verification:
      - kind: other
        ref: "Task 2 <verify><automated> of 181-09-PLAN.md (BUILD_ID_UNSET digits, BUILD_ID_SET equal to BUILD_SHA_GIVEN): exit 0; three builds, each 0 cached of 14"
        status: pass
    human_judgment: false
  - id: D4
    description: "On the built server the diagnostics route answers 404 by default and 200 when enabled, reports the ORIGIN it was given, and the address it reports is in no server output"
    verification:
      - kind: other
        ref: "Task 2 <verify><automated> of 181-09-PLAN.md (DIAGNOSTICS_DEFAULT_HTTP=404, DIAGNOSTICS_ENABLED_HTTP=200): exit 0"
        status: pass
    human_judgment: false

# Metrics
duration: 13min
completed: 2026-10-12
status: complete
---

# Phase 181 Plan 09: The Built Production Server, Outside Docker Summary

**The built server refuses a start with any of the four required variables not given (exit 1, one error naming exactly the missing ones), `/api/health` answers 200 in milliseconds with Supabase unreachable and reaches no upstream, the build id is the given sha with `BUILD_SHA` and a time-based number without it, and `/api/diagnostics` is 404 unless enabled. Both research assumptions held, so no code changed. The health control needed a stub adaptation that the verifier should rule on.**

## Performance

- **Duration:** 13 min
- **Started:** 2026-10-12T18:34:54Z
- **Completed:** 2026-10-12T18:48:05Z
- **Tasks:** 2 of 2
- **Files modified:** 2 (the evidence record, new; `deferred-items.md`, three entries added). No file outside `.planning/` changed.

## Accomplishments

- **Criterion 2, first half, observed.** With all four variables set the server listened and `/api/health` answered 200. Five starts with variables not given each ended by themselves with status 1 and one error line ending in `Required environment variables are not set: ` and exactly the missing names; none wrote `Listening on`. No output of any start holds a value that was given.
- **Criterion 1 observed, with its controls.** A counting stub upstream saw the six reads of the root page and no request from three health requests on a restarted server. With the configured upstream refusing connections (curl exit 7), health answered 200 in 0.005 s while the page differed by inlined upstream answers: 6 with the stub, 0 refused.
- **The build id observed in both legs.** `/api/health` and `/_app/version.json` agree: digits without `BUILD_SHA`, the given sha with it, digits again after the last rebuild.
- **The diagnostics switch observed.** 404 by default, 200 with `DEPLOYMENT_DIAGNOSTICS=true`; the body's origin is the `ORIGIN` given although the request's `host` header named another host; the reported address is in no server output.
- **A6 and A13 measured: both held.** `hooks.server.ts` is unchanged.

## Recorded statuses

Every status was read from the command itself, with output in a file under `tmp/181-09/`. None was read through a pipe.

| Check | Command | Status |
|-------|---------|--------|
| Frontend type check | `yarn workspace @openvaa/frontend typecheck`, on `fafaada0d` | 0 (`COMPLETED 2817 FILES 0 ERRORS 0 WARNINGS 0 FILES_WITH_PROBLEMS`) |
| Frontend lint | `yarn workspace @openvaa/frontend lint`, on `fafaada0d` | 0 (no finding) |
| Build 1, no `BUILD_SHA` | `yarn build` from the root, private empty turbo cache | 0 (`BUILD_EXIT`; 14 successful, 0 cached) |
| Build 2, `BUILD_SHA=0ec82ff4d…` | the same, another empty cache | 0 (14 successful, 0 cached) |
| Build 3, no `BUILD_SHA` | the same, another empty cache | 0 (14 successful, 0 cached) |
| Task 1 verify | the plan's command, verbatim | 0 |
| Task 2 verify | the plan's command, verbatim | 0 |

The verdict keys of the record, all 30, each once at the start of a line:

| Key | Value |
|-----|-------|
| `BUILD_EXIT` | 0 |
| `START_ALL_SET` | listening |
| `MISSING_PUBLIC_SUPABASE_URL_EXIT`, `MISSING_PUBLIC_SUPABASE_ANON_KEY_EXIT`, `MISSING_PUBLIC_PROJECT_ID_EXIT`, `MISSING_ORIGIN_EXIT`, `MISSING_TWO_EXIT` | 1 each |
| the five `MISSING_*_MESSAGE` | `Error: Required environment variables are not set: <the names>`, the two-variable one naming `PUBLIC_PROJECT_ID, ORIGIN` |
| `A6` | held |
| `STUB_BODIES` | minimal-valid-adapted |
| `UPSTREAM_DEPENDENT_ROUTE` | `/` |
| `ROUTE_STUB_HTTP` | 200 |
| `STUB_REQUESTS_FROM_ROUTE` | 6 |
| `STUB_REQUESTS_FROM_HEALTH` | 0 |
| `UPSTREAM_CONNECT_CURL_EXIT` | 7 |
| `PAGE_SUPABASE_UNREACHABLE_HTTP` | 200 |
| `UPSTREAM_DISCRIMINATOR` | inlined-fetches |
| `ROUTE_WITH_STUB` / `ROUTE_WITH_REFUSED` | 6 / 0 |
| `HEALTH_SUPABASE_UNREACHABLE_HTTP` | 200 (0.005369 s) |
| `A13` | held |
| `BUILD_ID_UNSET` | 1791830151116 |
| `BUILD_ID_SET` and `BUILD_SHA_GIVEN` | 0ec82ff4ddf9fe4b68bfa0264a859faafc7f8b76 |
| `DIAGNOSTICS_DEFAULT_HTTP` / `DIAGNOSTICS_ENABLED_HTTP` | 404 / 200 |

**Not run:** the frontend unit suite (the plan orders it only if `hooks.server.ts` is edited, and it was not), root `yarn test:unit`, the whole-workspace lint, `yarn format:check`, the E2E suite, any `supabase`, `yarn db:*` or `yarn dev*` command, any Docker command. No application code changed in this plan.

## Task Commits

1. **Task 1: Observe the start-up check on the built server** - `0ec82ff4d` (docs)
2. **Task 2: Observe health with Supabase unreachable, the build id, and the diagnostics switch** - `778d6f3b0` (docs)

`git log --oneline fafaada0d..HEAD -- apps/frontend/src/hooks.server.ts` prints nothing, and the file has no uncommitted change.

## Files Created/Modified

- `.planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-09-production-start.md` - the record: the keys of each part at the start of that part, then what was run, how each environment was constructed, each control before the observation it licenses, and the quoted outputs
- `.planning/workstreams/deployment/phases/181-deployability-and-migration-model/deferred-items.md` - three entries under "From plan 181-09"

## How the environments were constructed

- **Every server start** ran as `env -i PATH=… HOME=… PORT=3181 <the named variables> node ./apps/frontend/build/index.js` from the repository root. A removed variable was not written; none was set to the empty string to stand for "unset" (the one `ORIGIN=` start is the separate adapter observation).
- **The root `.env` was not opened, listed or printed.** What each process saw is established from its behaviour: each red start named exactly the variable it was not given; the stub received reads only from servers given its address; the diagnostics route was 404 without the switch and 200 with it; the build without `BUILD_SHA` served a time-based id.
- **Each build** ran as `yarn build` under `env -i` with `PATH`, `HOME`, an empty turbo cache directory of its own, and `BUILD_SHA` only in the set leg. Every task of every build executed here; nothing was replayed. The build itself reads the root `.env` through Vite and kit, which the plan cannot switch off without editing the config.
- **"Supabase unreachable"** was `http://127.0.0.1:9`, where nothing listens. The shared stack was not touched.

## Processes and ports

Seventeen processes were started (fifteen servers, two stubs), each recorded by pid. All are gone. Those that did not end by themselves were stopped with `SIGTERM` to their own pid; none needed `SIGKILL`. Ports 3181, 3182 and 9 have no listener.

## Decisions Made

- **The stub's one adaptation is a header on every answer.** See the first deviation.
- **Readiness by `lsof` on the started pid**, not by an HTTP request, so the three health requests of the count are the only requests the restarted server received.
- **A fresh empty turbo cache for each of the three builds.** Reusing the first build's cache for the last build would have restored the first build's output instead of building again.
- **The repository's absolute path is written `<repo>` in quoted output**, stated in the record. The five message lines hold no path and are verbatim.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The stub as the plan lists it is not valid for its caller; the one allowed adaptation was a header on every answer**
- **Found during:** Task 2, step 1
- **Issue:** With the three rules of the plan, the stub saw 16 requests from `/`: four reads, each four times, no `project_open_for_voters` call and no constituencies read. The server logged `reason: 'error'` and inlined no answer. For a universal load running on the server, kit 2.70.3 rejects a cross-origin answer without `access-control-allow-origin` (`src/runtime/server/page/load_data.js`), and the PostgREST client retries a `GET` whose fetch rejected three times. So every read failed, exactly as with no upstream.
- **Fix:** one rule added to the stub, `access-control-allow-origin: *` on every answer, and the control repeated once: six reads, each once, six answers inlined. Recorded as `STUB_BODIES=minimal-valid-adapted` with the rule quoted. The first run's values are in the record's table of what was tried.
- **Where it departs from the plan's words:** the plan describes the adaptation as "one rule for that path" with a different body. This rule is a header for all paths. It was used once, the control was repeated once, and no other stub body, route or observable was tried.
- **Why it matters:** without it the three values for `/` are 200, 0 and 7 with the stub and with the upstream refusing. The plan's bound would then have led to `/contestant/login` and probably to the blocking checkpoint.
- **Order:** the adaptation was made on the stub's log and the server's log record, before any request to a server whose upstream refused.
- **Files modified:** none tracked beyond the record
- **Verification:** the repeat of the control; Task 2 verify exit 0
- **Committed in:** `778d6f3b0`

### Additions to the plan's observations

These changed no tracked file beyond the record.

- The three values of the refused page request are joined by its duration (14.48 s) and by the content of the server's log record (`reason: 'error'` against `reason: 'empty'`).
- A third build-id reading after the last rebuild, to show the working tree's build serves digits again and is a new build.
- The response headers of the enabled diagnostics answer (`cache-control: no-store`).
- A search of all Task 1 output for all four given values, where the criterion names two.

---

**Total deviations:** 1 auto-fixed (1 bug in the plan's stub specification)
**Impact on plan:** the health control stands on the adapted stub. Nothing else departs from the plan.

## Issues Encountered

- **A command was refused by the secret-read hook and was not reworded.** A `grep` over `apps/frontend/vite.projectIdEnv.ts` and `vite.config.ts`, whose search pattern held the text `\.env`, was refused by the "Secret read guard" as a read of a protected file pattern. It read no `.env` file. It was dropped: what it would have shown (how the build reads the root `.env`) is described in the comment of `svelte.config.js`, already read. The two harmless parts of the same command line (a date conversion and `version.json`) were run without it.
- **`yarn` under `env -i`.** The node 24.21.0 bin directory holds no `yarn`; with `/usr/local/bin` in the constructed `PATH` the shim there runs under the first `node` in `PATH`. `yarn node --version` printed `v24.21.0`.

## What a later plan must know

- **A page's status says nothing about the upstream.** With Supabase unreachable `GET /` answers 200 after about 14.5 s with the application's error message. Row 1a of the research table names "a page route does not answer 200" as the red control; that does not hold. Use the count of `data-sveltekit-fetched` in the page (6 with a valid empty upstream, 0 with none), or the health route's independence itself.
- **A page request holds its connection for about 14.5 s while the upstream is down**: two retry chains of 1, 2 and 4 seconds. This bears on plan 181-14's drain measurement (an in-flight page request can outlast a short shutdown window for this reason alone) and on the timeouts of phase 185.
- **A stub of the Supabase API must send `access-control-allow-origin`**, or every read of a universal load fails on the server.
- **An empty project renders the error message too.** With a valid upstream that holds no election the page logs `A DataProvider returned an invalid result` with `reason: 'empty'` and shows "Something went wrong". So the error message on the page does not discriminate either.
- **The start-up error is Node's uncaught-error report**: 12 lines on standard error, of which one is `Error: Required environment variables are not set: <names>`. The line above it is the source line of the `throw` and holds the same words with a template placeholder; a search for the message must be anchored at the end of the line.
- **`ORIGIN` wins over the request's `host` header**: the diagnostics body reported `http://localhost:3181` for a request sent to `127.0.0.1:3181`. An empty `ORIGIN` is refused by adapter-node with "Invalid ORIGIN: ''…" and status 1 before `init` runs.
- **The server listens on `0.0.0.0` when `HOST` is not given**, and prints `Listening on http://0.0.0.0:<port>` on standard output. Nothing else is printed on a clean start; in particular nothing is logged for an unset `PUBLIC_LOG_LEVEL` in the production build's output.
- **`apps/frontend/build/` was last built without `BUILD_SHA`**, on the tree of `778d6f3b0` minus the second part of the record (id `1791830668774`). It is ignored by git.
- **Not observed here:** the image, the container, `SIGTERM`, a proxy in front of the server, `ADDRESS_HEADER` and `XFF_DEPTH`, a request that carries Supabase auth cookies (A13 is measured for a request without cookies only), and `/contestant/login` (not needed: `/` discriminated).
- **Scratch state** is in `tmp/181-09/` (ignored): the run scripts, every captured output, and three turbo cache directories.

## Not read

- `.planning/PROJECT.md` beyond its opening, Context and Constraints; a search of the rest for `api/health`, `BUILD_SHA` and `DEPLOYMENT_DIAGNOSTICS` found nothing.
- `181-RESEARCH.md` beyond the two paragraphs of Q6 the plan names (and the two that follow them), rows 1a, 1b and 2a of the criteria table, and the lines of A6, A9 and A13.
- `181-CONTEXT.md` beyond the lines of D-12 to D-15 and A-11, A-13. `181-PATTERNS.md` and `181-VALIDATION.md` were not read; the plan does not point to them.
- No `SKILL.md` under `.claude/skills/`: the plan touches no component, package or schema file.
- `.planning/WINDOWS.md` was not appended to: it is shared with the other workstream, and this workstream's plans have not written to it.

## Known Stubs

None. The counting stub is a scratch file under `tmp/` and is quoted in the record; nothing of it is in the tree.

## User Setup Required

None.

## Next Phase Readiness

- Plan 181-13 can rely on the unproxied observations of the record: health 200 without the upstream, the build id at both routes, the diagnostics body's `origin`.
- For the verifier or the operator: coverage D2, the reading of the allowed stub adaptation.
- Not closed here: SUPA-10 stays open until the last plan of the phase. INFRA-04, INFRA-05 and PIPE-07 are built toward.

## Self-Check: PASSED

- The evidence record and `deferred-items.md` exist.
- Commits `0ec82ff4d` and `778d6f3b0` are ancestors of `HEAD`.
- `commits: 2` is `git rev-list --count fafaada0d..HEAD` at the time of writing, with `HEAD` at `778d6f3b0`.
- Both tasks' verify commands exit 0 on the committed record; Task 1's was run again after the second part was appended.
- Every acceptance criterion of both tasks was checked by command: the 30 verdict keys occur once each at the start of a line; no message is `none`; no message line holds `unset-anon-key` or `127.0.0.1:9`; `hooks.server.ts` has no commit and no change since the task began; the search stayed inside its bound (one route, three values, one adaptation); the last build was made without `BUILD_SHA` (`version.json` holds digits); nothing listens on 3181 or 3182.
- The plan-level verification holds: every verdict line is in the record with its control before it, nothing listens on port 3181, and `hooks.server.ts` is unchanged.

---
*Phase: 181-deployability-and-migration-model*
*Completed: 2026-10-12*
