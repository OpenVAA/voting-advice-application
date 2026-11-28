---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 13
subsystem: infra
tags: [infra, supabase, hosted, throwaway, cloudflare, forwarded-headers, statement-timeout, drift, observations]
status: complete

requires:
  - "184-12: the three functions deployed on the throwaway begckvkapaopoztbreqc"
  - "184-11: 00001 pushed, the linked work directory kept, the drift check's default schema set"
provides:
  - "BEHIND_CLOUDFLARE=true, decided from a header record on the throwaway, for the bootstraps of both projects (184-15, 184-22)"
  - "The drift check seen red (exit 1) on a hosted database with planted functions and green (exit 0) after their removal; its guard refuses port 6543 and another project's host (exit 2)"
  - "The anon statement timeout measured on a served request: 9 s cut at about 8 s with 57014, 7 s completes"
  - "A second push-wrapper run up to date (exit 0); nothing temporary left on the project; the shadow cache removed"
  - "Five dated runbook Observations rows; two Not-yet-observed rows settled"
affects: [184-14, 184-15, 184-17, 184-22, 184-23]

actuals:
  tokens: 3900
  tasks: 3
  commits: 1
plan_head_before: 512ce3d9b45ce32e730cdf5136336f60328f6395
plan_head_after: 70d58c0aaf74a04843c34815fae8e7c951f66342

tech-stack:
  added: []
  patterns:
    - "Orchestrator-run sitting: numbered scripts, each a fresh shell sourcing one prelude (keychain credentials, repository root, pooler PG* variables, fixed log directory), printing only s<n>_ lines"
    - "Header comparisons computed in the shell against addresses held only in variables; only names, yes/no and counts leave the workstation"

key-files:
  created:
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-13-throwaway-headers-timeout-drift.md
  modified:
    - infra/envs/staging/supabase/README.md

key-decisions:
  - "BEHIND_CLOUDFLARE=true: Cloudflare refuses (403, error code 1000) every request that carries a client-sent cf-connecting-ip, and on every served request cf-connecting-ip is the connecting client, so a client cannot choose it (2026-11-10)"
  - "The plan's verdict input (the spoofed call's cf-connecting-ip at the database) does not exist because the call is refused before the project; the verdict rests on the refusal plus the orchestrator's read-only x-forwarded-for-only spoof (03x)"

requirements-completed: []  # OBS-07 also needs the >1000-row read and SUPA-01 closes on the persistent project's runs; both are measured here on the throwaway only

duration: about 30 min of agent work across two runs (checkpoint 2026-11-10T13:29Z, sitting 19:57Z-20:00Z, record 20:01Z)
completed: 2026-11-10
---

# Phase 184 Plan 13: The throwaway's forwarded headers, the anon timeout, and the drift check red and green Summary

BEHIND_CLOUDFLARE=true

**Drift check:**
- **Red:** `s4_drift_red_exit=1` while the two planted functions existed. The diff named both and nothing else.
- **Green:** `s7_drift_clean_exit=0` after they were dropped.
- **Guard:** it refused port 6543 and another project's host, each with exit 2.

**Why true.** A client cannot pick its own `cf-connecting-ip` on hosted Supabase. Cloudflare refuses any request that carries one, with 403 `error code: 1000`, before the request reaches the project. On every request that was served, `cf-connecting-ip` held the connecting client's address, on the function side and on the database side.

**Second push and timeout.**
- The second push run printed `push_up_to_date=yes` and exited 0.
- An anon RPC that sleeps 9 s was cut off after about 8 s with SQLSTATE 57014. A 7 s sleep completed.

## Performance

- **Duration:** about 30 min of agent work.
  - The checkpoint was raised at 2026-11-10T13:29:49Z (attempt `20261110T132949Z.512ce3d9b`).
  - The sitting ran from 19:57:04Z to 20:00:07Z.
  - The record attempt `184-13-3` opened at 20:01:19Z.
- **Completed:** 2026-11-10
- **Tasks:** 3 of 3
- **Files modified:** 2 tracked files, plus temporary files under `tmp/184-header-echo/` that Git ignores and that are now removed.

## Who ran the sitting

The orchestrator ran the sitting under the operator's authorisation of 2026-11-10. The credentials came from the operator's macOS keychain, service `openvaa-184-scratch`.
- The executor held no credential and ran nothing hosted.
- The executor wrote the numbered scripts under the session scratchpad's `184-13/` directory: `01-plant.sh` to `09-cleanup.sh` and `prelude.sh`. Each passed `bash -n`.
- The orchestrator added `03x-xff-only.sh`, which is read-only.

## Accomplishments

- **Task 1: the measurement files.** They were written under `tmp/184-header-echo/`, which Git ignores, and none was committed:
  - the `header-echo` function and its `config.toml`;
  - `probe-functions.sql`, which creates `probe_request_headers()` and `probe_sleep(double precision)`, revokes EXECUTE from PUBLIC and grants it to `anon`;
  - `drop-probe-functions.sql`.

  The SQL was tried first on the local stack, then dropped there.
- **Header record (D-19).**
  - **Function side:**
    - Headers that arrive: `cf-connecting-ip`, `cf-ew-via`, `cf-ray`, `cf-visitor`, `cf-worker`, `x-forwarded-for`, `x-forwarded-port`, `x-forwarded-proto`.
    - The platform rebuilds `x-forwarded-for` with 3 entries. A client-sent entry is dropped.
  - **Database side:**
    - The same headers arrive, except that `cf-ipcountry` is added and `x-forwarded-port` is missing.
    - `x-forwarded-for` keeps the value the client sent first and appends the connecting client last.
  - **Spoof test:** both calls that set `cf-connecting-ip` themselves got 403 from Cloudflare.
- **D-08 verdict:** `BEHIND_CLOUDFLARE=true`. The full reasoning is in the evidence, § 3.
- **D-22, drift check:**
  - Red with the planted functions, exit 1, `s4_drift_names_planted=2` and no other statement in the diff.
  - Green after their removal, exit 0, on the same hosted database.
  - The guard refused port 6543 and the persistent project's host, each with exit 2.
- **OBS-07, anon timeout:** an anonymous 9 s sleep returned 500 with `57014` after about 8 s. A 7 s sleep returned 204.
- **SUPA-01 / D-02, second push:** `s16_push_exit=0`, `s16_push_up_to_date=yes` and `s16_drift_status=0`.
- **Removal:**
  - The echo function was deleted and is no longer listed.
  - Both SQL functions were dropped, and the count left is 0.
  - The functions list holds exactly the three functions.
  - The shadow cache went from 1 to 0 entries, and the logs were removed.
- **Runbook:**
  - Five dated Observations rows: the `cf-connecting-ip` refusal and the verdict, the headers on each side, the anon timeout, the drift check red and green, and the second push.
  - Two Not-yet-observed rows are removed: the forwarded headers, and the anon timeout on a served request.

## Task Commits

1. **Task 1: the measurement files.** No commit, because every file is Git-ignored. The plan says to commit none of them.
2. **Task 2: the sitting.** A human-action checkpoint, with no commit. The reply is stored under `OPERATOR_REPLY=received attempt=20261110T132949Z.512ce3d9b plan=184-13 task=2 head=512ce3d9b45ce32e730cdf5136336f60328f6395`. The screen accepted it on the first `put`.
3. **Task 3: the evidence, the verdict and the runbook rows.** Commit `70d58c0aa`.

## Decisions Made

- **BEHIND_CLOUDFLARE=true, from three measured facts:**
  1. `cf-connecting-ip` is the client on every served request (`s3_pg_plain_cf_is_client=yes`, `s3x_pg_xffonly_cf_is_client=yes`).
  2. A client-sent `cf-connecting-ip` never reaches the project (`s3_pg_spoof_http=403`, `error code: 1000`).
  3. The only difference between the refused request and 03x's served one is that header.

  This is the condition `private.deployment_settings.behind_cloudflare` states. The throwaway stands for the persistent project, because the gateway is the platform's (D-19). Plans 184-15 and 184-22 export `BOOTSTRAP_BEHIND_CLOUDFLARE=true`.
- **Checking the orchestrator's reading.** I agree with it, with one refinement. With `false`, the rate-limit key would be the last `x-forwarded-for` entry, and on this measurement that entry is also the client. So `false` would not misbucket today. `true` is preferred because it does not depend on exactly one hop in front of PostgREST.
- **Not measured:**
  - a request that reaches the project's origin without passing through Cloudflare;
  - a request sent from another Cloudflare Worker.

  Separately, it is UNCONFIRMED that Cloudflare's code 1000 means a refused client-sent `cf-connecting-ip`. The refusal itself and the difference that triggers it are measured.

## Deviations from Plan

### Found in the sitting (orchestrator-reported)

**1. Cloudflare refused both spoofed calls, so the plan's verdict input was never produced.**
- **Found during:** Task 2, items 2 and 3.
- **What happened:** `s2_echo_spoof_http=403` and `s3_pg_spoof_http=403`. 03x classified the body as `error code: 1000`.
- **What the orchestrator did:** while the planted objects existed, it added the read-only `03x-xff-only.sh`. That script spoofs `x-forwarded-for` alone, and its lines are prefixed `s3x_`.
- **Effect:** the verdict rests on the refusal plus 03x (see Decisions). The plan's literal rule, the spoofed call's `cf-connecting-ip` at the database, cannot be evaluated.

**2. Script 05 ran while 04's drift check ran in the background.** 05 is read-only and shares nothing with the drift check, so the measurements are unaffected.

### Executor additions to the sitting (Rules 2 and 3)

**3. The sitting was written as orchestrator-run scripts.** This replaces the plan's operator blocks, per the orchestrator's sitting mode of 2026-11-10.
- **Guard lines added:**
  - `s0_is_throwaway`, `s0_anon_shape`, `s0_access_shape`, `s0_docker_exit`, `s0_pg_connect_exit` and `s0_measurement_files`;
  - `s<n>_env_ready` in every script.
- **The push in item 7 is gated.** It runs only after a green drift check, so nothing is pending and it never needs a terminal.
- **Comparison lines added:** `_cf_present`, `_cf_family` and `_xff_any_is_client`.
- **Removal checks added:** `s6_sql_functions_left` and `s6_echo_listed`.
- **The functions delete uses `--yes`,** and its stdin is `/dev/null`.
- **Keys reach curl through `-K <(printf …)`.** So no curl status is read through a pipe.

---

**Total deviations:** 2 found in the sitting and 1 group of executor additions.

**Impact:**
- The D-08 verdict comes from a stronger observation than the plan expected: the client's value is refused outright, not overwritten.
- Every other must-have was observed as specified.

## Issues Encountered

None beyond the deviations above.

## Deferred Issues

- None new. `s16_push_connection=unknown` is the CLI-marker gap already in deferred-items.md ("From 184-11").

## User Setup Required

None. The throwaway holds `00001` and the three functions, and nothing temporary.

## Next Phase Readiness

- **184-14:**
  - The drift check is now trusted on a hosted database.
  - `D09_TRIGGER=yes` still drives the `config.toml` change for `account-access`.
- **184-15 and 184-22:** set `BOOTSTRAP_BEHIND_CLOUDFLARE=true`.
- **184-17:** the probe's `db.anon-timeout` check reads the setting. The served behaviour is now on record: cut at about 8 s.
- **OBS-07:** still needs the read of more than 1000 rows.

## Self-Check: PASSED

- The evidence file is present.
  - It names `Attempt: 184-13-2 20261110T132949Z.512ce3d9b` and `Attempt: 184-13-3 20261110T200119Z.512ce3d9b`.
  - It holds `BEHIND_CLOUDFLARE=true` on a line of its own.
  - It holds no IPv4 address outside 203.0.113.0/24, and no key, token or e-mail address.
- The Task 3 checks exit 0:
  - the reply is bound to the current attempt;
  - all eleven required status lines are present;
  - there are exactly three `s17_function=` lines;
  - the verdict line is present;
  - the evidence names the attempt;
  - `tmp/184-header-echo` is gone.
- `prettier --check infra/envs/staging/supabase/README.md` exits 0.
- The runbook has no planning path, no decision id and no address. The disposable user's address appears in no file.
- Commit `70d58c0aa` is an ancestor of HEAD.
