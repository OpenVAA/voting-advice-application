---
phase: 185-aws-frontend-stack-first-apply-by-hand
plan: "03"
subsystem: frontend-server
status: complete
tags: [adapter-node, shutdown, sigterm, logging, diagnostics, cloudfront, e2e]
requires: []
provides:
  - "apps/frontend/src/lib/server/shutdown/shutdownLog.ts: InFlightCounter, createInFlightCounter(), SignalTarget { once, removeListener }, registerShutdownLog(counter, { target?, now?, emit? })"
  - "log line 'The server is exiting after its stop.' at warn, fields reason, signal, inFlightAtSignal, drainMs"
  - "hooks.server.ts: inFlightHandle first in sequence(...); registerShutdownLog(inFlight) at the end of init"
  - "/api/diagnostics allow-list adds cloudfront-viewer-address, x-amz-cf-id"
  - "evidence/185-03-built-server.md: DIAG_NEW_HEADERS=yes, DIAG_ORIGIN_HEADER_ABSENT=yes, DIAG_CLIENT_ADDRESS_DEPTH2=yes, SHUTDOWN_LINE_SEEN=yes, SERVER_EXIT=0, E2E_WRAPPER_EXIT=0, E2E_TARGETED=green"
affects: [185-04, the hosted SIGTERM and diagnostics observations of phase 185]
tech-stack:
  added: []
  patterns:
    - "Process-event listeners behind an injectable target, clock and emit, tested with an EventEmitter stand-in (the registerShutdownFlush precedent)"
key-files:
  created:
    - apps/frontend/src/lib/server/shutdown/shutdownLog.ts
    - apps/frontend/src/lib/server/shutdown/shutdownLog.test.ts
    - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-03-built-server.md
    - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/deferred-items.md
  modified:
    - apps/frontend/src/hooks.server.ts
    - apps/frontend/src/routes/api/diagnostics/+server.ts
    - apps/frontend/src/routes/api/diagnostics/server.test.ts
decisions:
  - "SignalTarget names removeListener as well as once: the line removes the signal listeners still attached, so nothing stays on the process after it"
  - "The first stop signal wins: on SIGTERM or SIGINT both signal listeners are removed, so a later signal cannot overwrite the recorded one"
  - "With no prior signal (an IDLE stop) signal, inFlightAtSignal and drainMs are all null"
  - "emit defaults to a wrapper that calls log.warn at call time, so a spy on log.warn sees the line"
metrics:
  duration: "about 95 min, of which about 20 min waiting for another checkout's E2E run to release the shared stack"
  completed: 2026-11-12
estimate:
  tokens: 32000
  tasks: 3
actuals:
  tokens: 4500
  tasks: 3
  commits: 5
plan_head_before: 7af155a65fb6426be9ae1f1e24c05da04e8241b7
plan_head_after: 0a796d39f26e62bcba1aaa917f9893943cb80235
---

# Phase 185 Plan 03: The stop line and the CloudFront headers Summary

**SHUTDOWN_LINE_SEEN=yes. E2E_TARGETED=green.**

When adapter-node emits `sveltekit:shutdown`, the production server now writes one `warn` line. The line names the reason, the first stop signal, the requests in flight when that signal arrived and the drain time, and nothing is left attached afterwards. `/api/diagnostics` now also reports `cloudfront-viewer-address` and `x-amz-cf-id`. Both changes were checked on the built server under `env -i`, and the `voter-journey` E2E project is green and not void.

## What was built

- **`shutdownLog.ts`**: `createInFlightCounter()` (never below zero) and `registerShutdownLog()`. It attaches `once` listeners for `SIGTERM`, `SIGINT` and `sveltekit:shutdown` to `process` by default. The signal listeners only record the first signal, the count at that moment and the time; adapter-node's own listeners still drive the shutdown. The shutdown listener writes the line and removes the signal listeners that are still attached.
- **`hooks.server.ts`**: there is one module-level counter. `inFlightHandle` is the first handle of `sequence`: it calls `enter()` before `resolve` and `leave()` in a `finally`. `init` keeps its `dev || building` guard first and calls `registerShutdownLog(inFlight)` only after the start-up check returns, so a server that refuses to start attaches nothing.
- **Diagnostics**: the two CloudFront names are appended to `FORWARDING_HEADERS`. The test's contract lists them, and a planted `x-origin-verify: origin-verify-secret` now sits beside `cookie`, `authorization` and `x-api-key` in the never-echoed set.

## Built-server observations (evidence/185-03-built-server.md)

- The diagnostics body carried both new headers. `x-origin-verify` and `planted` appeared zero times. `clientAddress` was `198.51.100.4`, the second entry from the right of the three-entry `x-forwarded-for`, with `XFF_DEPTH=2`.
- After `SIGTERM`, the shutdown line appeared exactly once (`reason: 'SIGTERM'`, `signal: 'SIGTERM'`, `inFlightAtSignal: 0`, `drainMs: 1`), and `wait` returned exit status 0.
- E2E: `tests/e2e-runs/185-03-20261112T165725Z`, wrapper status 0, no void marker. `e2e-spec-verdict.mjs --no-flaky` gave `VERDICT OK: 4 tests -- passed 4, failed 0, flaky 0, skipped 0, did not run 0`.

## Task commits

| Task | Commit | Message |
|------|--------|---------|
| 1 (RED) | aeea4100b | test(185-03): add failing cases for the shutdown log line |
| 1 (GREEN) | f930a9f5e | feat(185-03): write one warn line as the production server exits |
| 2 (RED) | de6446a5b | test(185-03): expect the two CloudFront headers from diagnostics |
| 2 (GREEN) | 5909e37d8 | feat(185-03): report the two CloudFront headers from diagnostics |
| 3 | 0a796d39f | docs(185-03): record the built server's stop line, headers and voter journey |

RED evidence:
- Task 1 failed on the missing module, `Test Files 1 failed`.
- Task 2 failed in the allow-list case, with the diff naming `cloudfront-viewer-address` and `x-amz-cf-id` as missing from the body: `1 failed | 10 passed`.

GREEN results:
- `shutdownLog.test.ts` plus `src/lib/server/startup`: 38 passed.
- Diagnostics: 11 passed.
- `yarn workspace @openvaa/frontend lint`: 0. `scripts/assert-comment-hygiene.mjs`: 0 violations. `typecheck`: 0 errors.

Tracer gate (Task 1, auto mode): unit, lint and hygiene were run again on the final tree after the lint fix, all at status 0, before Task 2 began.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `SignalTarget` also declares `removeListener`**
- **Found during:** Task 1
- **Issue:** The plan's type names only `once`. "No listener is left on the target afterwards" needs the line to remove the signal listener that never fired.
- **Fix:** Added `removeListener(event, listener): unknown`. `process` and `EventEmitter` both satisfy it.
- **Files modified:** apps/frontend/src/lib/server/shutdown/shutdownLog.ts
- **Commit:** f930a9f5e

**2. [Rule 1 - Bug] ESLint `func-style` on the per-signal listener**
- **Found during:** Task 1 lint, before the GREEN commit
- **Fix:** Changed the arrow function to a function declaration inside the `map` callback.
- **Commit:** f930a9f5e

**3. [Rule 3 - Blocking] The shared stack was re-homed onto this checkout before the E2E run**
- **Found during:** Task 3
- **Issue:** At the precondition check, the shared local Supabase stack held the `voting-advice-application-gsd` schema (21 migrations) and its edge-runtime functions mount. A full-suite E2E run from that checkout was in flight on it. This checkout has one migration, so an `--no-db-reset` run on that stack would have tested the wrong schema.
- **Fix:** Waited for the other run to finish on its own (its exit file held `0`). Confirmed that no `e2e-run.sh`, `playwright test` or `functions serve` process remained. Then ran `yarn db:stop` and `yarn db:reset` from this checkout, both with status 0, under the standing stack authorisation. Afterwards the stack held migration `00001`, and the edge runtime mounted this checkout's functions. The E2E run itself still used `--no-db-reset`, as planned.
- **Note for the operator:** the `-gsd` session will find the stack on this checkout's schema at its next run.

**4. [Rule 3 - Blocking] The E2E run used `FRONTEND_PORT=5273`**
- **Found during:** Task 3
- **Issue:** Port 5173 was held (`*:5173`, a wildcard bind) by an unrelated project's Vite dev server, started 2026-11-05.
- **Fix:** Left that server alone and used the documented one-off override, on a port that was free at the start of the run. The preflight passed (1 success, 0 failures).

**5. [Test coverage] One case beyond the behaviour list:** "keeps the first signal when a second one arrives before the shutdown event".

### Deferred Issues

- Server log records come out over several lines, because the default console sink prints an inspected object. A line-based log driver (`awslogs`) would split the shutdown line into about 12 events. This is outside the plan's files; it is logged in `deferred-items.md` with a remedy.

## Known Stubs

None.

## Threat surface

The plan's mitigations were applied:
- T-185-06: the allow-list only. The planted origin header was absent in both the unit case and the built server.
- T-185-07: the line holds a reason, a signal name and two numbers.
- T-185-08: `once` listeners only, removed after the line; exit status 0 on SIGTERM.
- T-185-SC: no package was installed.

No new surface beyond the threat model.

## Self-Check: PASSED

- FOUND: apps/frontend/src/lib/server/shutdown/shutdownLog.ts, shutdownLog.test.ts, evidence/185-03-built-server.md, deferred-items.md
- FOUND commits: aeea4100b, f930a9f5e, de6446a5b, 5909e37d8, 0a796d39f (each an ancestor of HEAD)
- Acceptance greps: `registerShutdownLog` in hooks.server.ts = 2; `'sveltekit:shutdown'` in shutdownLog.ts = 1; `'x-amz-cf-id'` in +server.ts = 1; `x-origin-verify` in +server.ts = 0; `'x-origin-verify'` in server.test.ts = 1
- Task 3 verify command: status 0
