---
phase: 188-relay-on-the-deployed-stack-and-the-per-caller-limit
plan: "16"
subsystem: infra
tags: [supabase, edge-functions, rate-limit, account-access, staging, cloudflare]
status: complete

requires:
  - phase: 188 (plan 10)
    provides: migration 00023 pushed to the hosted project and account-access deployed from a7003b490
  - phase: 184 (plan 22)
    provides: behind_cloudflare read true on the persistent project
  - phase: 184 (plan 13)
    provides: cf-connecting-ip carries the client behind Cloudflare, and a client-sent value is refused
provides:
  - "E-06: on the hosted account-access, CloudShell refused at its 31st check-code while the workstation was answered in the same window; the workstation refused at its own 31st and answered after its window"
  - "E-07: todo 2026-10-07-174 closed on that record; the sequential-scan item moved to a new pending todo"
  - "A dated Observations row in infra/envs/staging/supabase/README.md"
affects: [188-19]

actuals:
  tokens: 4227
  tasks: 3
  commits: 5
plan_head_before: b614fde3a92d0013dcf2716ff7c706d3e0038528
plan_head_after: 8b8db3515080b177e533acbbca4d973a362536a6

tech-stack:
  added: []
  patterns:
    - "A backgrounded script polls the attempt binding and makes the time-critical calls the moment it binds, after checking the answers, so the second caller lands inside the first caller's window"

key-files:
  created:
    - .planning/todos/pending/2026-11-15-invitation-link-request-sequential-scan.md
  modified:
    - .planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/evidence/188-16-hosted-limit.md
    - infra/envs/staging/supabase/README.md
    - .planning/todos/completed/2026-10-07-174-no-per-caller-limit-on-the-anonymous-invitation-operations.md (moved from pending/)

key-decisions:
  - "The workstation's calls ran from one backgrounded script that waited for the binding, checked answer_sitting=approve and cs_200=30 / cs_first_429=31, and only then called, so the first call landed 39 s after CloudShell's first 429"

requirements-completed: []
---

# Phase 188 Plan 16: The per-caller limit on the hosted account-access Summary

On the hosted `account-access`, the per-caller limit of migration `00023` refused AWS CloudShell at its 31st `check-code` while it kept answering this workstation in the same window. It then refused the workstation at its own 31st call with the same body, and answered it again once its window had ended.

## Performance

- **Started:** 2026-11-19T09:17Z (Task 1). Task 3's poll started at 09:53:54Z and saw the binding at 10:00:10Z.
- **Completed:** 2026-11-19T10:10:18Z (the last call), records by 10:16Z
- **Tasks:** 3 (Task 1 readiness, Task 2 the operator's CloudShell sitting, Task 3 the workstation's calls and the records)
- **Files modified:** 4 (evidence, runbook, todo moved, new todo)

## Results

- **CloudShell** (attempt `20261119T095140Z.b5b5ecf9f`, `answer_sitting=approve`): `E06_CS_200=30`, `E06_CS_429=2`, `E06_CS_FIRST_429=31`, `E06_CS_RETRY_AFTER=593`, `E06_CS_LIMITED_AT=2026-11-19T09:59:32Z`. That gives `E06_LIMIT_IN_FORCE=yes`.
- **The workstation while CloudShell was limited:** `E06_WS_FIRST_STATUS=200` at 10:00:11Z, 39 s after `E06_CS_LIMITED_AT`, so `E06_SAME_WINDOW=yes`.
- **The workstation's own limit:** `E06_WS_200=30` (first call included), `E06_WS_FIRST_429=31` at 10:00:23Z, `E06_WS_RETRY_AFTER=589`, `E06_429_BODY=too-many-requests`. No other status came back, and 31 calls were made.
- **The release:** after a 594 s wait (Retry-After + 5), `E06_WS_AFTER_WINDOW=200` at 10:10:18Z.
- **`E06_IPV6_NOTE`:** both callers used `curl -4`. The /64 keying of IPv6 rests on pgTAP only.
- No address, anon key or response body is recorded, apart from the 429's `error` word. No hosted throttle row was touched.

## Task Commits

1. **Task 1: Readiness, the trust flag, the CloudShell command:** `e16a1b011`
2. **Task 2: The operator's CloudShell sitting:** no commit (a human-action checkpoint; the reply is in the git-ignored attempt file)
3. **Task 3: The workstation's calls, the runbook row, the todo closed and moved:** `8b8db3515`

`commits: 5` is measured from `plan_head_before` and includes three 188-11 commits that landed between this plan's two (`7f4032f3e`, `eda544276`, `b5b5ecf9f`). This plan's own commits are `e16a1b011` and `8b8db3515`, plus this summary's metadata commit.

## Deviations from Plan

None. The plan ran as written. The workstation's calls ran from a backgrounded script, started before the reply arrived, which made the same checks Task 3 names (the binding, `answer_sitting=approve`, `cs_200=30` and `cs_first_429=31`) before its first call. Before it ran on the hosted function, a copy of it was tried against a loopback stand-in, using a throwaway `ATTEMPT_DIR` and a `Retry-After` of 3, and it printed every expected line.

## Issues Encountered

None.

## Next Phase Readiness

OBS-09 has its observation: the limit was built and seen limiting one caller without limiting another. The requirement stays open for the phase verifier, as the dispatch requires. Left open: a caller with many addresses, callers sharing one address, and deployments not behind Cloudflare. All three are named in the closed todo. The sequential scan is now `.planning/todos/pending/2026-11-15-invitation-link-request-sequential-scan.md`.

## Self-Check: PASSED

- FOUND: evidence/188-16-hosted-limit.md, infra/envs/staging/supabase/README.md, .planning/todos/completed/2026-10-07-174-no-per-caller-limit-on-the-anonymous-invitation-operations.md, .planning/todos/pending/2026-11-15-invitation-link-request-sequential-scan.md
- FOUND: e16a1b011, 8b8db3515 (ancestors of HEAD)
- Task 3 verify exit 0, Task 2 verify exit 0
