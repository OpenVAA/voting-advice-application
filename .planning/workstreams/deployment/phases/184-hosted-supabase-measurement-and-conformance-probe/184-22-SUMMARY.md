---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 22
subsystem: infra
tags: [infra, supabase, hosted, staging, persistent-project, bootstrap, first-administrator, smoke-dataset]
status: complete

requires:
  - "184-20: the persistent project's seven logging settings (attempt 184-20-2) and the session pooler path (aws-0, eu-north-1)"
  - "184-21: D01_GATE=proceed; migration 00001, the settings and the three functions on the persistent project"
  - "184-13: BEHIND_CLOUDFLARE=true; 184-08: hosted projects opened for voters at bootstrap; 184-15: the throwaway's ruling LOGGING_GATE=session-timeout and D12_SERVICE_ROLE=works"
provides:
  - "LOGGING_GATE=session-timeout for the persistent project"
  - "The persistent project cofbsatfrdysyphajsky holds the bootstrap rows (1,1,1,2,1), behind_cloudflare and open_for_voters true"
  - "Its first administrator, confirmed and holding the project-scope admin grant, whose token carries the hook's grants claim"
  - "The smoke dataset: 1001 nominations readable anonymously, for phases 185 and 186"
affects: [184-23, 184-24, 184-25, 185, 186]

actuals:
  tokens: 4067
  tasks: 3
  commits: 1
plan_head_before: b9aeceb2a485d1a70d81398250f37499df5a8787
plan_head_after: 09e3f89f1a7a3c8b16020aa431da6a90123c7338

tech-stack:
  added: []
  patterns:
    - "Each project-changing sitting script requires its predecessor's result file to read result=OK, and the first one also requires the gate line in the current attempt file"
    - "Statements that carry a secret as a bound parameter (the bootstrap's key, the grant's address) run under a 5 s statement timeout set inside their own session, checked with \\if before the script runs"

key-files:
  created:
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-22-persistent-bootstrap-admin-seed.md
  modified:
    - infra/envs/staging/supabase/README.md

key-decisions:
  - "LOGGING_GATE=session-timeout, applied by the orchestrator on 2026-11-11 under the operator's instruction to continue without stopping; the values are identical to the throwaway's, which the operator ruled session-timeout"
  - "The first administrator was created through the Auth Admin API (POST /auth/v1/admin/users, email_confirm true) instead of the dashboard because the operator was away; same effect (confirmed at creation, no invitation); recorded as a deviation from Step 21 item 1, and Step 21 is unchanged"

requirements-completed: [SUPA-06, SUPA-02]  # OBS-07's dataset is in place (1001 rows readable anonymously), but its untruncated read and the anon 8 s timeout are checked by the probe on the persistent project; 184-25 lists OBS-07 again

duration: about 15 min of wall clock, from attempt 184-22-2 (20:55:16Z) to the record (about 21:10Z); the sitting ran 21:01:17Z to 21:06:42Z plus the read and the cleanup
completed: 2026-11-11
---

# Phase 184 Plan 22: The persistent project's bootstrap, first administrator and smoke dataset Summary

**LOGGING_GATE=session-timeout. Row total: 1001** nominations readable anonymously on the persistent project (`s22_rows_range=0-0/1001`).

**What this plan did.** On the persistent project `cofbsatfrdysyphajsky`, the bootstrap ran twice under a 5 s session timeout, and both runs left the same rows (`1,1,1,2,1`). The first administrator now exists, created through the Auth Admin API, and holds the project-scope admin grant; a password sign-in returns a token whose `grants` claim carries that grant. The smoke dataset was seeded once.

## Performance

- **Sitting:** 2026-11-11, from 21:01:17Z to 21:06:42Z. The orchestrator ran it under the operator's standing staging authorisation, with credentials from the operator's keychain. The executor held no credential and ran nothing hosted.
- **Tasks:** 3/3. Task 1 is the gate, applied by the orchestrator. Task 2 was run by the orchestrator from seven scripts. Task 3 is this record.
- **Files:** 1 created, 1 modified.

## Accomplishments

- **The gate:** the seven settings were read again in the sitting and matched the ruled list (`s20_settings_as_ruled=yes`).
- **The bootstrap:** it ran twice, through the in-session timeout wrapper on the session pooler.
  - `s20_boot1_exit=0` and `s20_boot2_exit=0`, both with a `5s` session timeout.
  - Both counts read `1,1,1,2,1`. `open_for_voters` and `behind_cloudflare` were both `true` after each run.
  - `s20_check_seed_exit=0`, with no finding.
- **The first administrator:**
  - Before: no user had the address. The create call answered 200, and afterwards there was one user, confirmed, and not invited.
  - The grant: `s21_grant_exit=0`, `grants_on_project=1`.
  - The sign-in answered 200, and the claim names are the same as the throwaway's.
  - The claims hold `grants=[{"role":"admin","scope":"project","target_id":"00000000-0000-0000-0000-000000000001","target_type":null}]`. The session was then ended (logout 204).
- **The smoke dataset:** the anonymous read before the seed found no nomination. The seed exited 0 in about 5 minutes (21:01:39Z to 21:06:42Z), and the anonymous read after it answered 206 with `0-0/1001`.
- **The runbook:** "Observations" gained five dated rows: the bootstrap, `behind_cloudflare` as deployed, the API creation deviation, the token's claims, and the dataset. The only row of "Not yet observed" moved out, and the section now says nothing is pending.

## Task Commits

1. **Task 1 (the gate):** no commit of its own. The line `LOGGING_GATE=session-timeout` is in attempt `184-22-2` and in the evidence.
2. **Task 2 (the sitting):** no repository change. The reply is stored under `OPERATOR_REPLY=received attempt=20261111T205516Z.b9aeceb2a plan=184-22 task=2 head=b9aeceb2a485d1a70d81398250f37499df5a8787`.
3. **Task 3 (the record):** `09e3f89f1`, docs(184-22): record the persistent bootstrap, first administrator and smoke dataset.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The first administrator was created through the Auth Admin API, not the dashboard**
- **Found during:** Task 2.
- **Issue:** Step 21 item 1 is a dashboard action, and the operator was away.
- **Fix:** the orchestrator ran `03-admin-create.sh`, one `POST /auth/v1/admin/users` with the service-role key and `email_confirm: true`. The script refused unless 02 counted 0 users with the address, and it never printed the address, the user id or the body.
- **Effect:** the same as the dashboard step. The user is confirmed at creation, is not invited, and no mail was sent.
- **Recorded in:** the evidence and the runbook's Observations. Step 21 itself is unchanged.
- **Commit:** 09e3f89f1.

**2. [Rule 2 - Security] The grant and the address reads ran under the 5 s session timeout too**
- **Found during:** Task 2, when the scripts were written.
- **Issue:** `grant-project-admin.sql` binds the address as a parameter, so a statement slower than 10 s would be logged with it, through the same `auto_explain` pair the gate is about.
- **Fix:** the grant ran through an in-session wrapper that sets `statement_timeout = '5s'` and checks it first (`s21_grant_session_timeout=5s`). The read-only address counts used the same setting.

**3. [Rule 2 - Security] The administrator's session was ended after the claims were read**
- **Found during:** Task 2, when the scripts were written.
- **Fix:** `POST /auth/v1/logout` was sent with the token on a file descriptor (`s21_signout_http=204`), so no refresh token of that sign-in stays valid.

**Note on Task 1:** the gate is a decision checkpoint. Because the operator was away and had said to continue, the orchestrator applied the recommended option, on values identical to those the operator had already ruled on for the throwaway.

**Note on OBS-07:** this plan lists OBS-07, but it was left Pending in REQUIREMENTS.md. This plan observed only the dataset half: 1001 rows exist and their total is readable anonymously. The requirement's two checks, that a read of more than 1000 rows is not truncated and that `anon` runs with an 8 s timeout, are made by the probe on the persistent project. 184-25 lists OBS-07 again.

## Observations for later plans

- **The seed was faster here:** about 5 minutes on the persistent project, against about 15 on the throwaway. Step 22 still says "about 15 minutes".
- **One row before the bootstrap:** `private.deployment_settings` already held the migration's default row (`behind_cloudflare=false`), so `s0_counts_before` read `0,0,0,0,1`. The bootstrap overwrote that row with `true`.

## Self-Check: PASSED

- FOUND: the evidence file.
- FOUND: commit 09e3f89f1.
- The reply is bound to attempt 184-22-2.
- Both of Task 3's automated verifies exit 0.
- Prettier is clean on the runbook.
- The leak scan of the evidence and the runbook additions is clean: no address, key, token or IP, and the only long hex run is the head commit id.
