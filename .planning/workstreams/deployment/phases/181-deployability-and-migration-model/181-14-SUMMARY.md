---
phase: 181-deployability-and-migration-model
plan: 14
subsystem: infra
tags: [docker, sigterm, graceful-shutdown, adapter-node, nginx, evidence]

# Dependency graph
requires:
  - phase: 181-13
    provides: infra/local/docker-compose.proxy.yml, infra/local/check-proxy-topology.sh and the production image built with BUILD_SHA behind the pinned nginx
provides:
  - the --sigterm leg of infra/local/check-proxy-topology.sh (observation 7, with a shell-form control)
  - evidence/181-14-sigterm.md, criterion 3's SIGTERM clause observed, and SHUTDOWN_HANDLER=not-needed for phase 182
affects: [182, 185]

# Actuals (#2632)
# tokens is chars/4 over the lines added by this plan's two task commits (22405 characters).
# commits is git rev-list --count plan_head_before..HEAD when this summary was written.
actuals:
  tokens: 5601
  tasks: 2
  commits: 2
plan_head_before: a04bd21344404b2b7b0af3adc29d1865f683d503
plan_head_after: 582738b9ee9a497f2ebdca13b551996c4c778018

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "A request kept open at Node with no application change: a small form body uploaded with curl --limit-rate through a proxy with request buffering off, timed first with no signal"
    - "A stop is timed as the wall time of docker stop -t <n> <container>, and the exit code is read with docker inspect, never through a pipe"
    - "Decimal seconds go through awk under LC_ALL=C: a decimal-comma locale makes awk compare them as strings"

key-files:
  created:
    - .planning/workstreams/deployment/phases/181-deployability-and-migration-model/evidence/181-14-sigterm.md
  modified:
    - infra/local/check-proxy-topology.sh

key-decisions:
  - "181-14: EXITS_AFTER_DRAIN=yes. On SIGTERM the production server finished the request in flight (200) and exited by itself 9.1 s after the stop with code 0, so SHUTDOWN_HANDLER=not-needed: no shutdown module is created, and phase 182 attaches its own sveltekit:shutdown listener for the relay's flush."
  - "181-14: on node:24-alpine the shell-form control behaves like the exec form, because BusyBox sh replaces itself with the single command of a -c string (process 1 was node). The exec-form CMD stays, since it does not depend on that shell behaviour."
  - "181-14: the slow upload asks for JSON, so kit answers the login action with 200 and the action's own failure in the body, and no page render waiting on the unreachable backend lengthens the request."

patterns-established:
  - "A control that is recorded whichever way it goes is written to summary.txt with the status RECORDED; the leg fails on it only when it could not be run (exit 3)"

requirements-completed: []

coverage:
  - id: D1
    description: "The --sigterm leg: process 1 is node, the slow request lasts 8 to 20 s with no signal, the request in flight at the signal ends with the no-signal status, the container exits by itself in under 35 s with an exit code other than 137, and the shell-form control is recorded"
    verification:
      - kind: other
        ref: "bash infra/local/check-proxy-topology.sh --out tmp/181-14/run2 --sigterm: exit 0, 5 PASS and 3 RECORDED lines"
        status: pass
      - kind: other
        ref: "Task 1 <verify><automated> of 181-14-PLAN.md, run verbatim: exit 0"
        status: pass
    human_judgment: false
  - id: D2
    description: "The observations of plan 181-13 still pass on the changed script"
    verification:
      - kind: other
        ref: "bash infra/local/check-proxy-topology.sh --out tmp/181-14/full: exit 0, 15 PASS, 0 FAIL, the login NOT-RUN (not requested)"
        status: pass
    human_judgment: false
  - id: D3
    description: "The shutdown decision follows the measurement and leaves no shutdown module"
    verification:
      - kind: other
        ref: "Task 2 <verify><automated> of 181-14-PLAN.md, run verbatim: exit 0; git status --porcelain -- apps/frontend/src prints nothing"
        status: pass
    human_judgment: false

# Metrics
duration: 18min
completed: 2026-10-14
status: complete
---

# Phase 181 Plan 14: SIGTERM Reaches Node and the Process Exits by Itself Summary

**Branch taken: `SHUTDOWN_HANDLER=not-needed` (`EXITS_AFTER_DRAIN=yes`, `A13_PROCESS_EXIT=held`). No source file changed. Phase 182 attaches its own `sveltekit:shutdown` listener for the relay's flush; there is no shared shutdown module to register through.**

Behind the pinned nginx, process 1 of the production container is `node ./apps/frontend/build/index.js`. A 36000-byte form upload at 3000 B/s stays open at Node for 12.0 s with no signal. Started again and stopped 2 s in with `docker stop -t 40`, it still ends 200 with the same body, and the container exits by itself 9.1 s after the stop with exit code 0. The shell-form control (`/bin/sh -c "node …"`) ran the same way, because BusyBox `sh` replaced itself with `node`.

## Performance

- **Duration:** about 18 min, 2026-10-14 21:27:41Z to 21:45:38Z. About 11 of them were the full re-run of the topology check, whose control build's `yarn install` was not served from cache (481 s).
- **Tasks:** 2 of 2.
- **Files:** 1 created, 1 modified.

## Recorded verdicts (evidence/181-14-sigterm.md)

| Key | Value |
|-----|-------|
| `PID1_COMMAND` | `node ./apps/frontend/build/index.js` |
| `SLOW_REQUEST_SECONDS_NO_SIGNAL` | `12.0` (36000 bytes at 3000 B/s, HTTP 200) |
| `IN_FLIGHT_HTTP` | `200` |
| `SECONDS_TO_EXIT` | `9.1` |
| `CONTAINER_EXIT_CODE` | `0` |
| `EXITS_AFTER_DRAIN` | `yes` |
| `CONTROL_PID1_COMMAND` | `node ./apps/frontend/build/index.js` |
| `CONTROL_IN_FLIGHT` | `HTTP 200 after 12.0 s, curl exit 0` |
| `CONTROL_SECONDS_TO_EXIT` / `CONTROL_EXIT_CODE` | `9.1` / `0` |
| `SIGTERM_LEG_EXIT` | `0` |
| `SHUTDOWN_HANDLER` | `not-needed` |
| `A13_PROCESS_EXIT` | `held` |

## Command statuses

| Command | Status |
|---------|--------|
| `bash -n infra/local/check-proxy-topology.sh` | 0 |
| `check-proxy-topology.sh --out tmp/x --sigterm --with-login` | 2 (usage error, as intended) |
| `--sigterm` run 1 | 1 (the locale fault below) |
| `--sigterm` run 2 | **0** |
| Full check without `--sigterm` (`--out tmp/181-14/full`) | **0** |
| Task 1 verify, verbatim | 0 |
| Task 2 verify, verbatim | 0 |
| `yarn prettier --check infra/local <record>` | 0 |

No whole-repo gate was run: the plan orders none for the not-needed branch, and no workspace builds or imports the changed script. The Task 2 frontend gates (`test:unit`, `lint`, `typecheck`) belong to the installed branch, which was not taken.

## Task Commits

1. **Task 1: Add the SIGTERM leg, run it and its control** - `34681044f` (feat)
2. **Task 2: Act on the measurement** - `582738b9e` (docs, the decision lines; no code)

## Files Created/Modified

- `infra/local/check-proxy-topology.sh`: the `--sigterm` flag and observation 7 in the header; `compose()` layers an optional override file; the verdict moved into `finish()` so both paths share it; the status `RECORDED` for a control; numeric awk under `LC_ALL=C`; `--sigterm` with `--with-login` is a usage error.
- `evidence/181-14-sigterm.md`: the record, the three runs, the pasted `summary.txt` and `07-sigterm.txt`, and the decision.

## Decisions Made

See `key-decisions` above. The control's result is a property of the base image's shell: it shows that the shell-form failure mode does not occur on `node:24-alpine` with a single-command `-c` string, not that it can never occur.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Decimal seconds compared as strings in a decimal-comma locale**
- **Found during:** Task 1, run 1
- **Issue:** the host has `LC_NUMERIC=fi_FI.UTF-8`. awk printed the stop time as `9,1` and then compared it with 35 as a string, so `sigterm.exit.by-itself` read FAIL on `exit code 0 after 9,1 s`.
- **Fix:** the three numeric awk calls go through `c_awk`, which runs awk under `LC_ALL=C`. No expectation changed.
- **Verification:** run 2 exits 0 with `9.1 s`.
- **Commit:** `34681044f`

**2. [Rule 2 - Correctness] The in-flight status must equal the no-signal status**
- **Issue:** the plan's verify accepts any three-digit status, but behind nginx a connection cut by the server reads as 502, a three-digit status.
- **Fix:** the leg's `sigterm.in-flight.status` line expects the status the same upload got with no signal (200), and a separate line checks the upload was still open when the signal was sent.
- **Commit:** `34681044f`

### Note on the image

The acceptance criterion's full re-run (observations of plan 181-13) rebuilt `openvaa-proxy-check-frontend:latest` with the same `BUILD_SHA=d2c6ae678…`, so the kept image now has id `sha256:2b4e2dd4124c…`, not 181-13's `sha256:09722451198b…`. The `--sigterm` run used the 181-13 image before that rebuild. The application source is unchanged between the two (only docs and `infra/` changed since `d2c6ae678`, and `infra/` is not in the build context).

---

**Total deviations:** 2 auto-fixed, both in the script. **Impact on plan:** none on the verdict keys.

## TDD

Task 2 is `tdd="true"`, but its behaviour block applies only when `EXITS_AFTER_DRAIN=no`. The measurement says `yes`, so no module, test or RED evidence was produced, as the plan orders for that branch.

## Issues Encountered

- The control build's `yarn install` layer was not in the build cache although every `COPY` before it was (481 s). The cache may have been collected by Docker since plan 181-13. It finished; nothing was pruned.
- Host bash is 3.2: a test of the helpers with process substitution did not work and was dropped; run 2 is the check.

## What phase 182 and later plans must know

- **`SHUTDOWN_HANDLER=not-needed`.** The process ends by itself after adapter-node drains, so phase 182 adds its own `process.on('sveltekit:shutdown', …)` for the relay's flush. There is no `onShutdown` registry.
- **That result holds only while nothing holds the event loop.** If the relay keeps a timer, interval or open socket, the process will no longer exit after draining. Phase 182 should end or `unref()` such handles on `sveltekit:shutdown`, and re-run `bash infra/local/check-proxy-topology.sh --out <dir> --sigterm` after rebuilding the image (`docker compose --env-file /dev/null -f infra/local/docker-compose.proxy.yml build frontend`, backgrounded): `sigterm.exit.by-itself` will FAIL if the process lingers.
- **The leg takes about one minute** on the present image and needs no Supabase.

## Known Stubs

None.

## Threat Flags

None. The leg adds no listener beyond 181-13's loopback-only proxy port.

## Not read

- `.planning/PROJECT.md` was not read in this plan; the plan names no section of it, and its topics (`SIGTERM`, shutdown) were covered by the plan's own reading list.
- `181-RESEARCH.md` beyond the four passages the plan names; `181-CONTEXT.md` beyond a grep for D-15 and A-13.
- No `SKILL.md` under `.claude/skills/`: the plan touches no component, package or schema.
- `.planning/WINDOWS.md` was not appended to: no stub, skipped test or unrun verify is left.

## Self-Check: PASSED

- `infra/local/check-proxy-topology.sh` and `evidence/181-14-sigterm.md` exist; `apps/frontend/src/lib/server/startup/shutdown.ts` does not.
- Commits `34681044f` and `582738b9e` are ancestors of `HEAD`; `commits: 2` is `git rev-list --count a04bd2134..HEAD` at writing.
- No container of `openvaa-proxy-check` exists, port 8181 has no listener, and both images are present.

---
*Phase: 181-deployability-and-migration-model*
*Completed: 2026-10-14*
