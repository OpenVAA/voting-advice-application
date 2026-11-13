---
created: 2026-10-22T14:00:00.000Z
title: After a void E2E run, the mock OIDC issuer that Playwright started keeps 127.0.0.1:9443, so the restore check fails and the next run refuses to start
area: tests / E2E harness
severity: minor
source: Phase 179 (observed at 179-16-held, recorded in 179-16-SUMMARY.md § Items to report and 179-CARRIED-ITEMS.md; filed by 179-23)
owner: unassigned
files:
  - tests/scripts/e2e-run.sh (the void teardown, and the restore's port check)
  - tests/playwright.config.ts (the `webServer` entry that starts `tests/tests/support/mockOidcIssuerEntry.ts`)
---

## Problem

Playwright's `webServer` entry starts the mock OIDC issuer (`npm exec tsx …/mockOidcIssuerEntry.ts`) on 127.0.0.1:9443 for every default run. On a normal end, Playwright stops it.

When the wrapper ends a run as **void**, after a host suspend, exit 8 with `VOID-host-suspend.txt`, its teardown does not reach Playwright's `webServer` children. Observed at `tests/e2e-runs/179-e2e/179-16-held`:

- the issuer was reparented to pid 1 and kept listening on 9443;
- `restore.txt` recorded `port 9443: STILL HELD` and ended `restore: FAILED`, though the run itself still exited 8 (void);
- the next run would have refused to start, because the wrapper refuses while 9443 is held.

The executor stopped that one process by hand before `-r2`, after checking it was this checkout's mock issuer and only 14 minutes old. The restores after that were `ok`.

The same gap is likely for any other end of the wrapper that kills Playwright instead of letting it finish, but that is inferred: only the void case was observed.

## Solution

- In the wrapper's teardown, on every exit path, find a listener on 127.0.0.1:9443 whose command line is this checkout's `mockOidcIssuerEntry.ts`, and stop it before the restore's port check. Match on the command line, never on the port alone: another checkout's run may hold the port.
- Or start the issuer from the wrapper itself, as it already starts the JWKS server on port 8777, and drop the `webServer` entry, so the wrapper owns its lifetime.
- Add the case to the wrapper's own tests, if a void run can be simulated (a forced stop of Playwright mid-run).

## Resolution

**Resolved:** 2026-10-29, by plan 179.1-27 (D-23 E5), with the first solution above.

- **What was built.** `stop_own_mock_issuer [port]` in `tests/scripts/e2e-run.sh` (port 9443 by default). For each listener on the port (`lsof -nP -iTCP:<port> -sTCP:LISTEN -t`) it reads the command line (`ps -o command= -p <pid>`); a listener whose command line holds this checkout's absolute path to `tests/tests/support/mockOidcIssuerEntry.ts` is sent SIGTERM with its process group (the issuer runs in a group of its own, under `npm exec tsx`, apart from Playwright's), then SIGKILL after 30 s; any other listener is left alone. The port alone never decides. `cleanup` calls it on every exit path, after the function and JWKS servers are stopped and before the stack is restored and its ports are checked; its lines open `restore.txt` (`mock issuer: stopped <pid>`, `mock issuer: foreign listener left (pid <pid>)`, or `mock issuer: no listener on port 9443`).
- **The self-test case.** `tests/scripts/e2e-run.sh --self-test`, `the mock issuer's stop, matched by command line`: two scratch listeners on ephemeral ports, one whose command line holds the entry's path and one that does not; the first is stopped, the second is left running and is then stopped by the test. Red without the function (`tests/e2e-runs/179.1-unit/179.1-27-selftest-red-2.*`, exit 1), green with it (`179.1-27-selftest-green-3.*`, 10 of 10).
- **Proven** by the full run `tests/e2e-runs/179.1-e2e/179.1-27-held-stop` of the uncommitted wrapper (643 of 643; `restore.txt` opens `mock issuer: no listener on port 9443`, Playwright having stopped its issuer itself, and ends `restore: ok`).
- **Commit:** `9e6cf1b4c` (`fix(179.1-27): the E2E wrapper stops its own mock issuer on every exit, a void run included`).
- **Not done:** starting the issuer from the wrapper and dropping the `webServer` entry (the second solution). No void run was forced to observe the stop on the real issuer; the case of the original observation is the self-test's.
