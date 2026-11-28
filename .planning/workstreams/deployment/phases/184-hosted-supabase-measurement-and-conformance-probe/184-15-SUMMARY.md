---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 15
subsystem: infra
tags: [infra, supabase, hosted, throwaway, bootstrap, logging-gate, first-admin, smoke-dataset, observations]
status: complete

requires:
  - "184-13: BEHIND_CLOUDFLARE=true from the header record"
  - "184-14: D09_APPLIED=yes (account-access verify_jwt = false) and D12_RAISED=no"
  - "184-11: 00001 pushed, so the access-token hook's function exists"
  - "184-10: the seven logging settings and the disposable user"
provides:
  - "LOGGING_GATE=session-timeout (operator, 2026-11-10), carried out by an in-session SET, because the session pooler drops PGOPTIONS"
  - "SUPA-06's twice-run equality on a hosted database: both bootstraps exit 0 with counts 1,1,1,2,1 and the same booleans; the seed check exits 0"
  - "The first administrator's token carries the hook's grants claim: one project-scope admin object on the canonical project"
  - "The smoke dataset on the throwaway: 1001 nominations read anonymously in one request (206, 0-0/1001)"
  - "D12_SERVICE_ROLE=works: the legacy service-role key served the bootstrap's stored key and dev-seed's writes"
  - "account-access, redeployed with verify_jwt false, answers the apikey-only shape itself (200, its own body)"
  - "Runbook: Step 17's verify_jwt list, Step 20's in-session timeout wrapper, Step 22's duration, six dated Observations rows"
affects: [184-16, 184-17, 184-20, 184-22, 184-23]

actuals:
  tokens: 4400
  tasks: 3
  commits: 1
plan_head_before: 977bd5b13f3f44c5d18791f48bbd12feab6f0dc5
plan_head_after: a9130421af5ad8fe70369305169aaf4901de2521

tech-stack:
  added: []
  patterns:
    - "A session statement timeout set through the session pooler with SET in the same psql session, checked with \\if before the included script runs"
    - "The sitting prelude unsets every credential a script does not name, so the service-role key and the disposable user reach only the scripts that use them"

key-files:
  created:
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-15-throwaway-bootstrap-admin-seed.md
  modified:
    - infra/envs/staging/supabase/README.md

key-decisions:
  - "LOGGING_GATE=session-timeout, ruled by the operator on 2026-11-10: only auto_explain's 10 s duration pair would log a bound parameter, so every bootstrap statement runs under a 5 s statement timeout"
  - "The timeout is set by SET inside the bootstrap's session, not by PGOPTIONS: through the session pooler a startup option did not reach the session (show statement_timeout returned 2min)"
  - "D12_SERVICE_ROLE=works: plan 184-14's key-model checkpoint is not raised again"

requirements-completed: []  # SUPA-06, SUPA-02 and OBS-07 are shown here on the throwaway only; they close on the persistent project's runs (184-22), as in 184-10 to 184-14

duration: 23h (wall clock, including the operator's ruling and the orchestrator's two sitting attempts)
completed: 2026-11-11
---

# Phase 184 Plan 15: The throwaway's logging gate, two bootstraps, the first administrator and the smoke dataset Summary

**LOGGING_GATE=session-timeout. D12_SERVICE_ROLE=works. The smoke dataset gives 1001 nominations to an anonymous read.** On the throwaway, both bootstrap runs left the same rows (`1,1,1,2,1`). The disposable administrator's token carries the hook's `grants` claim, and `account-access`, redeployed with `verify_jwt` false, now answers the `apikey`-only shape itself.

## Performance

- **Started:** 2026-11-10T21:49:45Z (attempts `184-15-1` and `184-15-2` opened)
- **Sitting:** 2026-11-11. The first attempt started at 06:27:33Z and was discarded. The full rerun ran from 08:17:37Z to 08:32:58Z UTC.
- **Completed:** 2026-11-11T08:40Z
- **Tasks:** 3 (one decision, one sitting, one record)
- **Files modified:** 2

## Who ran the sitting

The orchestrator ran the sitting under the operator's authorisation of 2026-11-10, with credentials from the operator's keychain (service `openvaa-184-scratch`).
- **The scripts:** the executor wrote six scripts and their prelude in the session scratchpad (`184-15/`), held no credential, and ran nothing hosted.
- **The ruling:** the operator ruled on the logging gate on 2026-11-10 (`answer_logging_gate=session-timeout`), and the orchestrator relayed it.
- **The replies:** both are stored under their `OPERATOR_REPLY=` lines (attempt `20261110T214945Z.977bd5b13`), and the screen accepted them.

## Accomplishments

- **Logging gate.** One pair of the seven settings would log a slow statement's parameters: `auto_explain.log_min_duration=10s` with `auto_explain.log_parameter_max_length=-1`. The gate was therefore raised, and the operator chose `session-timeout`. Script 03 read the seven settings again in the sitting, found them unchanged, and only then bootstrapped.
- **`account-access` (D-09).** Step 17 from the linked work directory now lists `account-access` and `identity-callback` with `verify_jwt=false`. With the legacy anon key, shapes (a) `apikey` only and (b) `apikey` + Bearer both reached the function: 200, `{"status":"unknown"}`, at the first try each.
- **Bootstrap (D-08, SUPA-06).** Both runs exited 0 under a 5 s session timeout, each with `1,1,1,2,1`, `open_for_voters=true` and `behind_cloudflare=true`. `s20_check_seed_exit=0`.
- **First administrator (D-11, SUPA-02).**
  - `s21_grant_exit=0` and `grants_on_project=1`, then a password sign-in with status 200.
  - The claim names are the auth service's own plus `grants`.
  - `grants` holds exactly the project-scope `admin` object on `00000000-0000-0000-0000-000000000001`, which is what `custom_access_token_hook` adds.
- **Smoke dataset (D-18, OBS-07).** `s22_seed_exit=0`, about 15 minutes, 2017 rows. The anonymous read returned `206` with `0-0/1001`.

## Task Commits

1. **Task 1: the logging gate.** Decision checkpoint, ruled `session-timeout` by the operator on 2026-11-10. No file change.
2. **Task 2: the sitting.** Human-action checkpoint, run by the orchestrator. No repository file change; the scripts are in the scratchpad.
3. **Task 3: the record.** `a9130421a` (docs): the evidence file and the runbook.

**Plan metadata:** the commit that follows this SUMMARY (docs: complete plan).

## Decisions Made

- **The logging gate: `session-timeout`**, ruled by the operator on 2026-11-10.
- **How the timeout is set:** in-session `SET` with an `\if` check, not `PGOPTIONS`, because the pooler drops the startup option. Runbook Step 20 now gives this wrapper. I tested its exact text against the local database with a harmless included file. It ran the include when the session reported `5s`, and it stopped with exit 3 when the check did not match.
- **The key model stays:** `D12_SERVICE_ROLE=works`, so the legacy service-role key remains the bootstrap's stored key and dev-seed's key.

## Deviations from Plan

### Found in the sitting (orchestrator-reported)

**1. [Rule 1 - Bug] The session pooler drops `PGOPTIONS`**
- **Found during:** Task 2, script 03
- **Issue:** with `PGOPTIONS='-c statement_timeout=5s'`, `show statement_timeout` through the pooler returned `2min`. The guard I had put in 03 stopped the script before it wrote anything.
- **Fix:**
  - The orchestrator changed 03 to run the bootstrap through a psql wrapper: `SET statement_timeout = '5s'`, then `\if` the session reports `5s`, then `\i infra/scripts/bootstrap.sql`, otherwise stop.
  - Its first version used a `CASE … 1/0` guard, which PostgreSQL constant-folds while planning. It failed with exit 3 before any bootstrap statement ran.
  - Runbook Step 20 now carries the working wrapper and says that `PGOPTIONS` does not survive the pooler.
- **Files modified:** `infra/envs/staging/supabase/README.md` (Step 20); the scratchpad's `03-bootstrap.sh`
- **Commit:** a9130421a

**2. [Rule 3 - Blocking] The keychain held cut-off legacy keys (run 1 discarded)**
- **Found during:** Task 2, script 01
- **Issue:** the `security` prompt had cut the legacy anon and service-role keys at 128 characters, with one dot. Run 1's role lines were empty, and its two `account-access` shapes sent an invalid JWT.
- **Fix:** the orchestrator re-stored both keys in full from the Management API, using an operator-approved script that prints only shape lines (208 and 219 characters, two dots, the right role, the ref matching). It then reran all six scripts. Every recorded line is from that rerun.
- **Files modified:** none in the repository

**3. [Rule 1 - Bug] `s22_seed_host_is_throwaway=` did not print**
- **Found during:** Task 2, script 05
- **Issue:** under bash 3.2, a `case` pattern's closing parenthesis inside `$( … )` is misparsed. The seed still used the prelude's fixed throwaway URL.
- **Fix:** I moved the `case` statement out of the command substitution in the scratchpad's `05-seed.sh`. `bash -n` passes under `/bin/bash`.
- **Files modified:** the scratchpad's `05-seed.sh` only

### Executor additions (Rules 1 and 2)

**4. [Rule 1 - Bug] Runbook Step 17's expected list was out of date.** After 184-14, `verify_jwt=false` holds for `account-access` as well as `identity-callback`. I corrected the line; the dated 2026-11-10 Observations row stays as it was observed.

**5. [Rule 2 - Missing critical] The guards in the sitting scripts.**
- **The prelude** refuses every ref but the throwaway's and unsets every credential a script does not name, so the service-role key reaches 01, 03 and 05 only, and never a probe.
- **01** checks the role claim of both legacy keys locally. That check is what exposed the cut-off keys in run 1.
- **03** refuses to write unless the seven settings equal the values the ruling was made on, and unless the session reports the timeout.

**6. Runbook Step 22 states the seed's duration** (about 15 minutes, nearly all of it portrait uploads), as the orchestrator asked.

### An executor mistake without effect

While testing the Step 20 wrapper, I extracted the code block with a pattern (`^   T=`) that first matched Step 18's `T="infra/envs/$R/supabase"`. In my own shell, that ran Step 18's `terraform init` and `terraform plan`. `R` held the runbook's path, so `-chdir` named a directory that does not exist, and both commands exited 1 at once. I checked afterwards: no directory, plan file, lock file or state was created, nothing reached a backend or a hosted project, and I held no credential. I repeated the test with the block's exact line, against the local database only, with a harmless included file.

## Issues Encountered

None open. The `PGOPTIONS` finding changes what the persistent project's Step 20 runs (184-22): the in-session wrapper, with `T` set when the gate is again `session-timeout`.

## Deferred Issues

None.

## User Setup Required

None beyond the sitting.

## Next Phase Readiness

- **What the throwaway now holds:** the bootstrap rows, an administrator with a working token, and the smoke dataset. These are the inputs of the probe sitting (184-16, 184-17).
- **The persistent project (184-22)** gets the same steps: Step 19's read, a gate ruling on its own values, Step 20 through the wrapper when a timeout is ruled, then Steps 21 and 22.

## Self-Check: PASSED

- FOUND: `.planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-15-throwaway-bootstrap-admin-seed.md`
- FOUND: `infra/envs/staging/supabase/README.md` (Prettier check exit 0)
- FOUND: commit `a9130421a` (ancestor of HEAD)
- Task 3's two automated verifies exit 0. The first covers the bound reply, every status and count line, and a range total of 1001 > 1000. The second covers `LOGGING_GATE=`, `D12_SERVICE_ROLE=works`, the `Attempt: 184-15-3` line and Prettier.
