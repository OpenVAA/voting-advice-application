---
phase: 189-documentation-and-closure
plan: "17"
subsystem: planning-records
status: complete
tags: [identity-callback, auth, hosted-settings, todos, closure, G-01, G-03, G-04]
requires:
  - 189-05 (the 2026-11-20 probe run on the persistent project, 22/22 PASS)
  - 189-08 (the hosted-settings reference page the closure cites)
  - 189-12 (the guide's hosted-project sections)
provides:
  - "The identity-callback closing check (G-04), re-measured on 2026-11-20 with file:line: opaque replies, sub on all four claim-config sites, verify_jwt false locally and PASS on the hosted project, no drift guard"
  - "The hosted-auth todo closed on the record (G-01, G-03)"
  - "Two new pending todos: pre-launch auth checks on the production project, and the identity-callback claim-config drift guard"
affects:
  - DOCS-08 (one more of the seven todos closed; the requirement completes when 189-18 closes the remaining five)
tech-stack:
  added: []
  patterns: ["each unobserved ask is either observed by a named probe row or moved with its check; none is closed silently"]
key-files:
  created:
    - .planning/workstreams/deployment/phases/189-documentation-and-closure/evidence/189-17-identity-callback-check.md
    - .planning/todos/pending/2026-11-20-189-identity-callback-claim-config-drift-guard.md
    - .planning/todos/pending/2026-11-20-189-pre-launch-auth-checks-on-the-production-project.md
  modified:
    - .planning/todos/completed/2026-10-07-174-hosted-project-auth-settings-allowlist-and-function-variables.md (moved from pending/)
key-decisions:
  - "G-03: the OTP length counts as observed through auth.other-settings PASS, which compares mailer_otp_length (hosted-settings.json:21, 10) with the served value; the dashboard label no longer matters"
  - "G-03: of the identity-callback secret checks, only the keyless POST refused 401 is observed (functions.identity-callback-unverified); the rest moves, because staging has no IDENTITY_CALLBACK_SERVER_SECRET and no bank authentication on the AWS task"
  - "G-03: the shared sign-in budget moves; the existing 179.1 todo keeps the fuller procedure and is cross-referenced rather than duplicated or closed"
  - "G-04(a): the CORS preflight's literal 'ok' (index.ts:190) is recorded as a reply site that is not an error reply; every other reply goes through respond() and resultBody()"
metrics:
  duration: "about 15 min; ledger written 2026-11-20T21:55:49Z, summary 2026-11-20T22:00Z"
  completed: 2026-11-20
estimate:
  tokens: 45000
  tasks: 3
actuals:
  tokens: 5200
  tasks: 3
  commits: 3
plan_head_before: 9a4b7f47946833fbffbc1b93ea2c415373e33f42
plan_head_after: 4cae6a4c7008a9d97177d62dafb75cdb9b767202
---

# Phase 189 Plan 17: The identity-callback closing check and the hosted-auth todo's closure Summary

This plan re-measured the identity-callback closing check on 2026-11-20. Every reply is one fixed result of `requestContract.ts`, and all four claim-config sites key accounts on `sub`. `verify_jwt = false` is at `config.toml:436`, and the 189-05 probe passed it on the hosted project. No drift guard exists between the frontend and Deno copies, so a todo is filed for one. The hosted-auth todo is closed, and its two unsettled asks move into a pre-launch todo, each with its check.

## What was done

**Task 1, the closing check (G-04), commit `5d6a58688`.** Written to `evidence/189-17-identity-callback-check.md`, with every line number taken by `grep -n` today:

- (a) Thirteen `G04_REPLY` lines, one per `return` in `index.ts` (lines 190 to 357). Every reply except the CORS preflight's literal `ok` goes through `respond()` (index.ts:77). `respond()` serialises `resultBody()` (requestContract.ts:123), which turns anything outside `IDENTITY_CALLBACK_RESULT` into `unavailable` through `asResult` (line 75). The six interpolated `${error.message}` throws are logged by the catch arm and answered without their text. `G04_OPAQUE=yes`.
- (b) `sub` at claimConfig.ts:43 and :48, signicat.ts:40 and idura.ts:39. `birthdate` and `ftn_sub` appear only in comments that forbid them, and `birthdate` also appears in the frontend's `extractClaims`, which is not a match key. `G04_MATCH_AGREES=yes`.
- (c) `G04_VERIFY_JWT=apps/supabase/supabase/config.toml:436 false`. Both `functions.verify-jwt` and `functions.identity-callback-unverified` read PASS in the 189-05 run (`S1_READ_AT=2026-11-20T13:34Z`).
- (d) Three `git grep` searches found no test that imports both copies. Each side pins only its own literals. `G04_DRIFT_GUARD=none`, and `2026-11-20-189-identity-callback-claim-config-drift-guard.md` is filed.

**Task 2, the pre-launch todo (G-03), commit `4bf0a18f3`.**

- `G03_OTP_LENGTH` is observed through `auth.other-settings` PASS.
- `G03_CALLBACK_SECRET` is observed only for the keyless POST refused `401`. The other checks are moved: the secret on both sides, the wrong-secret POST, the two unset-variable answers and a completed sign-in.
- `G03_SIGNIN_BUDGET=moved`.
- `2026-11-20-189-pre-launch-auth-checks-on-the-production-project.md` has two `## Check:` sections.

**Task 3, the closure (G-01), commit `4cae6a4c7`.** The todo was moved with `git mv`, and `completed: 2026-11-20` and `status: completed` were added to its frontmatter. `## Closed (phase 189), 2026-11-20` was appended, with What was built, What remains and Moved. The original body is unchanged: the diff has zero removed lines.

## Deviations from Plan

None that change scope. Three things are recorded as found:

- **The hosted half of the secret checks cannot be observed on staging.** `2026-11-20-189-bank-authentication-on-the-aws-task.md` and the hosted-settings page both record that `IDENTITY_CALLBACK_SERVER_SECRET` is set nowhere on the AWS path, so a wrong-secret POST on staging would answer `configuration`, not `refused`. The pre-launch todo says this and points to the bank-auth todo.
- **The sign-in budget already had a pending todo** (`2026-10-26-179.1-...shared-sign-in-budget...`). As G-03 asks, the new todo holds the check, and it cross-references the 179.1 todo, which stays open. They are to be closed together.
- **The closure cites the phase-184 throwaway reads** (184-16 for mail, redirects and slot release, 184-13 for the headers) for items of the old todo's "What was never observed" list that the plan's action did not name. It also records one item that was not re-checked: the refusal `account-access` gives on a project whose sign-up is open.

No blocker: every reply is opaque, and all four copies agree.

## Verification

- Task 1, Task 2 and Task 3 `<automated>` blocks: exit 0 each.
- Acceptance: `G04_REPLY` count 13 (>= 1); the pre-launch title count 1 (>= 1); the What was built / What remains / Moved count 3 (>= 3).
- E2E: no project affected. No source, spec or fixture was changed, only `.planning/` records.
- Prohibition: nothing called `identity-callback` or any hosted endpoint. The hosted half comes from the 189-05 rows.

## Self-Check: PASSED

- FOUND: evidence/189-17-identity-callback-check.md, both new pending todos, and the completed todo; the pending original is absent
- FOUND commits: 5d6a58688, 4bf0a18f3, 4cae6a4c7 (each an ancestor of HEAD)
