---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
plan: "07"
subsystem: infra
tags: [k6, load-test, docker, capacity, OBS-11]
status: complete

requires:
  - phase: 188-04
    provides: "wave-1 predecessor of this plan; nothing of it is called by the load check"
provides:
  - "infra/scripts/load-check.sh: k6 2.4.0 pinned by digest, target allowlist, --confirm-target, --max-rate, journey host/path refusals, anon key through the environment only"
  - "infra/scripts/load-check/voter-journey.js: one constant-arrival-rate scenario per step tagged step, per-step page/relay/error thresholds, global 5 % abort after 1 m, a relay post after each page, handleSummary to /out/summary.json with a load_check member"
  - "infra/scripts/load-check/figure.mjs: step=... met= lines, figure_journeys_per_minute=, figure_step="
  - "infra/scripts/load-check/journey-from-trace.mjs: a Playwright trace's network lines to a journey file, journey_requests=<n>"
  - "infra/scripts/load-check/README.md: the method beside its script"
affects:
  - "188-18 (records a staging journey with journey-from-trace.mjs and runs load-check.sh against staging)"

actuals:
  tokens: 16000
  tasks: 3
  commits: 4
plan_head_before: d22da1d669b4492c920bee16be72d20da7c7a026
plan_head_after: 6d7021b721959d0e139202dfef6a059fcbe46b5e

tech-stack:
  added: ["grafana/k6:2.4.0 container image, pinned by digest sha256:d41bb79c…a7e276 (no repository package)"]
  patterns:
    - "Per-step k6 thresholds on tagged sub-metrics, one constant-arrival-rate scenario per step with startTime offsets"
    - "Wrapper self-test against a stand-in docker on PATH: every refusal exits 2 with its reason and docker is never called"

key-files:
  created:
    - infra/scripts/load-check.sh
    - infra/scripts/load-check.test.ts
    - infra/scripts/load-check/voter-journey.js
    - infra/scripts/load-check/local-journey.json
    - infra/scripts/load-check/figure.mjs
    - infra/scripts/load-check/journey-from-trace.mjs
    - infra/scripts/load-check/README.md
    - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/evidence/188-07-local-dry-run.md
  modified: []

key-decisions:
  - "A journey file is one object { base, routeId, locale, requests }, not a bare array: the relay batches need a route id and locale and the wrapper checks base against --base-url; journey-from-trace.mjs writes that object, taking --route-id (default /(voters)) and --locale (default en)"
  - "The extractor replays reads only: GET/HEAD to either origin and POST to /rest/v1/rpc/ with its body; REST writes, preflights, websockets and every other method are dropped; RPC bodies a trace stores as resources are read from --resources, and a missing one exits 1 (journey_bodies_missing=<n>)"
  - "A local dry run needs the dev server bound to 127.0.0.1 (--host 127.0.0.1): a [::1]-only bind is not reachable through host.docker.internal on Docker Desktop"
  - "The figure is the rate of the highest step whose page p95 < 1000 ms, relay p95 < 300 ms and error rate < 1 %, read from the per-step sub-metric values; a step with no values is not met"

patterns-established:
  - "k6 2.4.0 summary field paths: metrics[\"http_req_duration{kind:page,step:<i>}\"].values[\"p(95)\"], metrics[\"http_req_failed{step:<i>}\"].values.rate"

requirements-completed: []

coverage:
  - id: D1
    description: "The wrapper refuses a non-allowlisted base URL, staging without a matching --confirm-target, a step above --max-rate, a foreign host or refused path in the journey, a data request without a key and an existing --out, each with exit 2 before Docker; a valid run uses the pinned image and keeps the key off the command line"
    requirement: OBS-11
    verification:
      - kind: unit
        ref: "infra/scripts/load-check.test.ts#refuses every unsafe target, step, journey and output with exit 2, before Docker"
        status: pass
    human_judgment: false
  - id: D2
    description: "figure.mjs prints one line per step and the highest step met, 0/none when no step met, none for a step without values"
    requirement: OBS-11
    verification:
      - kind: unit
        ref: "infra/scripts/load-check.test.ts#figure.mjs"
        status: pass
    human_judgment: false
  - id: D3
    description: "voter-journey.js holds the per-step thresholds, the global abort, handleSummary and no literal key"
    requirement: OBS-11
    verification:
      - kind: unit
        ref: "infra/scripts/load-check.test.ts#voter-journey.js"
        status: pass
    human_judgment: false
  - id: D4
    description: "journey-from-trace.mjs keeps pages and Supabase reads in order, copies RPC bodies, no header/cookie/key, exits 1 on an empty yield"
    requirement: OBS-11
    verification:
      - kind: unit
        ref: "infra/scripts/load-check.test.ts#journey-from-trace.mjs"
        status: pass
    human_judgment: false
  - id: D5
    description: "One local step ran end to end through the pinned k6 image against a dev server and printed its per-step line"
    requirement: OBS-11
    verification:
      - kind: manual_procedural
        ref: "evidence/188-07-local-dry-run.md (Task 1 automated verify)"
        status: pass
    human_judgment: false
  - id: D6
    description: "The method in README.md reads as a sufficient basis for the recorded capacity figure"
    verification: []
    human_judgment: true
    rationale: "Whether the written method is adequate for OBS-11's figure is a judgment the phase verifier makes; the staging run itself is plan 188-18"

duration: 23min
completed: 2026-11-18
---

# Phase 188 Plan 07: The Load Check's Method and Tools Summary

**k6 2.4.0 from its digest-pinned image replays a recorded voter journey at stepped arrival rates, with per-step thresholds, a 5 % abort and a figure in journeys per minute; proven by one local step.**

`requirements-completed` is empty on purpose: the dispatch keeps OBS-11 open until the staging run (plan 188-18) and the phase verifier close it.

## The dry run and the summary's field paths

The local dry run's step line (one 60 s step at 1 journey a minute against a dev server of this checkout):

```
k6_exit=0
step=1 rate_per_min=1 page_p95_ms=83.5 relay_p95_ms=1.8 error_rate=0.0000 met=yes
figure_journeys_per_minute=1
figure_step=1
```

The summary k6 2.4.0 writes through `handleSummary` has the top-level keys `options,state,metrics,root_group` plus the
`load_check` member the script adds. `figure.mjs` reads:

- `metrics["http_req_duration{kind:page,step:<i>}"].values["p(95)"]`
- `metrics["http_req_duration{kind:relay,step:<i>}"].values["p(95)"]`
- `metrics["http_req_failed{step:<i>}"].values.rate` (a k6 Rate: `values.passes` counts the failed requests)
- `load_check.steps`, the step rates

Each per-step sub-metric also carries `thresholds["<expression>"].ok`. They appear in the summary because each has a threshold, as research assumption A11 expected.

## Performance

- **Duration:** about 23 min
- **Started:** 2026-11-18T19:10Z (approximate)
- **Completed:** 2026-11-18T19:33Z
- **Tasks:** 3
- **Files created:** 8

## Accomplishments

- `infra/scripts/load-check.sh` runs `grafana/k6:2.4.0@sha256:d41bb79cd8de5a7ad619b53570e3712633e8bff0937010a5c6c57a4747e7a276`. I re-checked the digest with `docker buildx imagetools inspect` (it is the multi-arch index). The wrapper allows only `https://staging.openvaa.org` with a matching `--confirm-target`, or `http://host.docker.internal:<port>`. It refuses a step above `--max-rate`, a journey that reaches any other host or `/auth/v1/`, `/functions/v1/`, `/api/usage` or `/_app/immutable/`, and an existing `--out`. Its self-test has 17 cases and needs no Docker.
- `voter-journey.js`: one `constant-arrival-rate` scenario per step tagged `step`. Each step has three thresholds:
  - page p95 under 1000 ms
  - relay p95 under 300 ms
  - errors under 1 %

  A global `http_req_failed` above 5 % aborts the run after one minute. After each page the script posts one valid `answer` relay batch with a UUIDv7 visit id stamped with the current time.
- `figure.mjs` prints one line per step and then the figure.
- `journey-from-trace.mjs` turns trace network lines into a journey file that holds no header, cookie or key.
- `README.md` sets out the method beside the script: the journey, the steps, the thresholds and abort, the figure and what it is recorded with, provider `log`, the per-minute generator reads, the single-client limit, the AWS and Supabase policies, and the commands.

## Task Commits

1. **Task 1: One local step end to end** - `2260576cc` (feat)
2. **Task 2: The guards and the figure under test, and the method** - `73629d71c` (test)
3. **Task 3: A recorded browser journey becomes a journey file** - `d6cd78d5f` (test, RED), `6d7021b72` (feat, GREEN)

## Files Created/Modified

- `infra/scripts/load-check.sh` - the wrapper, with its guards and self-test
- `infra/scripts/load-check.test.ts` - vitest: self-test, figure fixtures, k6 script text, extractor fixtures (19 tests)
- `infra/scripts/load-check/voter-journey.js` - the k6 script
- `infra/scripts/load-check/local-journey.json` - `/` and `/api/health` at `http://host.docker.internal:5275`
- `infra/scripts/load-check/figure.mjs` - the figure computation
- `infra/scripts/load-check/journey-from-trace.mjs` - the journey extractor
- `infra/scripts/load-check/README.md` - the method
- `evidence/188-07-local-dry-run.md` - digest lines, route, dry-run lines, summary keys, server stopped

## Decisions Made

See `key-decisions` in the frontmatter. In short:

- The journey file is an object rather than a bare array.
- The extractor keeps read requests only.
- A dry run needs the dev server on IPv4 loopback.
- The figure is computed only from the per-step values.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The image inspect and pull stalled on the operator's Docker credential helper**
- **Found during:** Task 1
- **Issue:** `docker buildx imagetools inspect grafana/k6:2.4.0` and `docker pull` never returned under the operator's `~/.docker` config. They were waiting on the credential store.
- **Fix:** Ran both with a scratchpad `DOCKER_CONFIG` that has no credential helper (and `DOCKER_HOST` set to the Docker Desktop socket for the pull). The digest is the registry's either way. Once the image was local, the wrapper's `docker run` worked under the normal config.
- **Files modified:** none (evidence records it)
- **Commit:** 2260576cc

**2. [Rule 3 - Blocking] The container could not reach a `[::1]`-only dev server**
- **Found during:** Task 1
- **Issue:** Vite bound `[::1]:5275`, and `host.docker.internal` refused the connection. The plan expected this might happen ("otherwise the dry run records the route it used").
- **Fix:** Started the dev server with `--host 127.0.0.1`. The evidence records `DRY_RUN_ROUTE=` and the README's command includes the flag.
- **Commit:** 2260576cc

**3. [Rule 2 - Missing critical] The journey shape and the extractor's safety rules**
- **Found during:** Tasks 1 and 3
- **Issue:** The plan describes a journey array, but a bare array can carry neither the base the plan puts in `local-journey.json` nor the route id and locale the relay batch needs. Copying every POST from a trace would also replay writes, such as feedback inserts.
- **Fix:**
  - The journey file is `{ base, routeId, locale, requests }`, and the extractor writes it, with `--route-id` and `--locale`.
  - The extractor keeps only GET/HEAD and RPC POSTs, and drops websockets and preflights.
  - It reads `_sha1` bodies from `--resources`, and exits 1 when an RPC body cannot be read.
- **Commits:** 2260576cc, 6d7021b72

**4. [Rule 2 - Missing critical] More guards in the wrapper and the script**
- **Issue:** k6 sends an anonymous usage report by default. The plan listed the refused paths for the wrapper only.
- **Fix:**
  - `-e K6_NO_USAGE_REPORT=true`.
  - The script itself also refuses Auth, function and relay paths, and data requests without a key.
  - `--max-rate` is required.
  - The self-test checks that each refusal gives its own reason.
- **Commit:** 2260576cc

### TDD note

Task 2's self-test cases were written together with the wrapper and went into Task 1's commit, and `figure.mjs` existed before its vitest cases. So Task 2 had no failing commit before its implementation. Instead I showed its tests can fail with a mutation: setting `STEP_ERROR_RATE` to 0.02 in `figure.mjs` failed one test, and the file was restored. Task 3 has a genuine RED commit (`d6cd78d5f`, 5 failing) before GREEN (`6d7021b72`).

**Total deviations:** 4 auto-fixed (2 blocking, 2 missing critical).
**Impact on plan:** None of these changes the method. They make the local route work, keep secrets and writes out of the journey, and make the refusals stricter.

## Issues Encountered

- With rate r and step length T, k6's `constant-arrival-rate` started r·T/60 + 1 iterations: 2 at 1 a minute over 60 s, one at 0 s and one at 60 s. This is recorded in the evidence. It does not affect the per-step percentiles.
- The local default project has no published data, so `/` logged `A DataProvider returned an invalid result.` while still answering 200. The dry run proves the method, not a capacity.

## Verification

- `yarn test:unit:infra load-check`: 19/19 passed. The full `yarn test:unit:infra`: 16 files, 418 tests passed. `yarn assert:unit-coverage` passed.
- `prettier --check` on every new file: clean. `assert:comment-hygiene`, `assert:declared-binaries`, `assert:test-keys-scope` and `assert:edge-env-defaults`: all exit 0.
- Task 1's automated verify: exit 0. `abortOnFail` count: 1. `lsof -i :5275` exits 1. `journeys per minute` in the README: 2. `journey_requests` in the extractor: 3.
- Nothing hosted was called. OBS-11 stays open in REQUIREMENTS.md until plan 188-18 and the phase verifier close it.

## User Setup Required

None.

## Next Phase Readiness

Plan 188-18 still has to do the deployed work:
1. Record one voter run on staging with a trace.
2. Extract the journey with `journey-from-trace.mjs --resources`.
3. Set the provider to `log` by hand.
4. Choose `--max-rate` from the hosted project's plan (G5).
5. Run `load-check.sh` against staging with `--confirm-target`, reading the generator's load every minute.
6. Record the figure with the date, commit, task count, CPU and the resource that bound it.

## Self-Check: PASSED

- All 8 created files exist on disk.
- Commits 2260576cc, 73629d71c, d6cd78d5f and 6d7021b72 are ancestors of HEAD.
- Every acceptance criterion and plan-level verification command was re-run and exited 0.

---
*Phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit*
*Completed: 2026-11-18*
