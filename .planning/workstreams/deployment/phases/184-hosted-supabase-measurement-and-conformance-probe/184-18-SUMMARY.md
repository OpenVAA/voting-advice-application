---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 18
subsystem: infra
tags: [infra, supabase, hosted, throwaway, conformance-probe, fault-injection, account-access, observations]
status: complete

requires:
  - "184-17: CATALOG_ROLE=postgres and the throwaway's green probe run (22 PASS, exit 0)"
  - "184-16: the request-link call with a witness, the stale-read replan rule, and the fact that function logs are a dashboard read (the Management API logs endpoint answers 410)"
  - "184-07: infra/envs/scratch/supabase/faults.tf (fault_set none|redirect|all)"
provides:
  - "MAJOR_RED=expectation-override (ruled by the operator 2026-11-11): db.postgres-major fails against an expectation of 16 set in the working tree for the run only"
  - "The batched break planted on the throwaway and left in place for 184-19"
  - "A red run with 21 of 22 checks failing by their own planted fault; functions.identity-callback-unverified not seen failing"
  - "OBS-05's two refusing branches of account-access seen on the served function, each with a not-sent witness"
  - "The finding that the provider refreshes the module's settings resource from the served values, so a planted value shows as drift of module.supabase.supabase_settings.this"
affects: [184-19, 184-20, 184-22]

actuals:
  tokens: 8100
  tasks: 3
  commits: 1
plan_head_before: d6769ac3b26b8ec861bf8d1fc0b4a442e4c22504
plan_head_after: 19a2d09e8db3e89424b80fa189cb7c8bbca8c1f4

tech-stack:
  added: []
  patterns:
    - "A tracked-file override for a single run, made and reverted inside one script by an EXIT trap, then checked with git diff --quiet"
    - "Fault-plan rule lines compared as sorted sets; a variant line set is accepted only under a named argument the operator rules on"

key-files:
  created:
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-18-throwaway-break-red.md
  modified:
    - infra/envs/staging/supabase/README.md
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/deferred-items.md
    - .planning/WINDOWS.md

key-decisions:
  - "MAJOR_RED=expectation-override, ruled by the operator on 2026-11-11 via the orchestrator (the plan's recommended option)"
  - "The rule lines of item 2 were widened to module-refresh, ruled by the operator on 2026-11-11: exactly the module settings resource and the fault resource updated in place, Plan: 0 to add, 2 to change, because the replan after the redirect fault showed the module resource refreshed from the planted values"
  - "The red run does not satisfy SUPA-07: one check, functions.identity-callback-unverified, passed. SUPA-07 is not marked complete"
  - "OBS-05 is complete: both refusing branches are seen here and the slot release was seen in 184-16"

requirements-completed: [OBS-05]  # SUPA-07 stays open: 21 of 22 checks seen failing; see Issues

duration: about 2 h 10 min from the Task 2 attempt id (10:20:34Z) to the record; the sitting ran from 10:37:10Z to about 11:13Z, with the operator's dashboard steps in between
completed: 2026-11-11
---

# Phase 184 Plan 18: The batched break of the throwaway and the probe's red run Summary

**The red run does not count in full.** The probe exited 1 with 21 `FAIL` lines, 1 `PASS` and no `COULD NOT RUN`. Each of the 21 findings names its own planted fault, and none names a cascade. `functions.identity-callback-unverified` passed, although `identity-callback` was listed with `verify_jwt` true, so SUPA-07 stays open. Both refusals of `account-access` were seen, each with a `not-sent` witness, which closes OBS-05.

**Faults left in place for 184-19 to revert:**
- `supabase_settings.faults[0]` at `fault_set=all`: site URL and redirect list on `planted.invalid`, both hooks off, sign-up open, autoconfirm on, SMTP port `2465`, the OAuth server on, `password_min_length` 12, `max_rows` 500, `db_schema` `public`. The module settings resource plans an in-place update.
- The `private-assets` bucket is deleted.
- The `send-email` function is deleted.
- `identity-callback` is listed with `verify_jwt` true.
- `public.custom_access_token_hook(jsonb)` is renamed to `custom_access_token_hook_planted`.
- `anon` has `statement_timeout` `3s`.
- One user in the `openvaa.test` domain exists.

The working tree's `config.toml` is unchanged.

## Performance

- **Sitting:** 2026-11-11, from 10:37:10Z (UTC). The orchestrator ran it under the operator's authorisation of 2026-11-10, with credentials from the operator's keychain. The operator did the two dashboard blocks. The executor held no credential.
- **Tasks:** 3 of 3 executed. The check of Task 3 found the gap above.
- **Files modified in the repository:** 4.

## Accomplishments

- **Task 1:** `MAJOR_RED=expectation-override`, ruled by the operator on 2026-11-11.
- **Task 2, the sitting:** eleven scripts in the session scratchpad (`184-18/00-start.sh` to `10-cleanup.sh`, with a prelude), all with exit 0.
  - Redirect fault: plan on the exact rule, applied. The served site URL read as planted after 20 s, and the auth service refused the function's callback. `account-access` was redeployed. A request-link gave `s1_witness=not-sent`, and the operator saw the redirect-allowlist log line.
  - Every settings fault, under the `module-refresh` rule, applied. All eight auth values and both API values were read back as planted.
  - `send-email` deleted; `identity-callback` PATCHed to `verify_jwt` true; the hook function renamed; `anon` at 3 s.
  - In the dashboard, the bucket was deleted and the user added. Script 07 confirmed both by id and by a count.
  - The probe ran with the override: `s23_probe_exit=1` (21 FAIL, 1 PASS). The trap reverted the override (`s8_override_reverted_diff_exit=0`).
  - Redeploy, then a request-link with sign-up open: `s9_witness=not-sent`, and the operator saw the sign-up log line.
- **Task 3:**
  - Reply stored and `bound`, check attempt `184-18-3`.
  - Evidence written whole from the attempt files, with the red-run table pairing each check, its fault and its finding.
  - Five dated Observations rows and one "Not yet observed" row added to the runbook. Prettier is clean.

## Task Commits

1. **Tasks 1 to 3: the rulings, the red run, the refusals and the runbook rows:** `19a2d09e8` (docs)

Tasks 1 and 2 changed no repository file. Their outputs are the rulings and the attempt file, recorded in the commit above.

## Decisions Made

See `key-decisions`. Both rulings came from the operator on 2026-11-11, via the orchestrator.

## Deviations from Plan

**1. [Orchestrator direction] The major-version override was made inside the probe script**
- **Found during:** Task 2
- **Issue:** The plan had the executor edit `config.toml` before the checkpoint and revert it in Task 3.
- **Fix:** Script 08 made the one-line edit, ran the probe and put the file back by an EXIT trap. That gives a shorter window, and the override cannot outlive a failed sitting. Task 3's `git checkout` was a no-op check: `git diff --quiet` was 0.

**2. [Rule 3 - Blocking, ruled] The rule lines of item 2**
- **Issue:** The replan after the redirect fault showed `module.supabase.supabase_settings.this` updated in place. So the plan's only allowed lines (the fault resource alone, 1 to change) could not occur.
- **Fix:** A named `module-refresh` rule, used only on the operator's ruling of 2026-11-11. It allows exactly the two resources updated in place and `Plan: 0 to add, 2 to change, 0 to destroy.` The end state is the same, because the fault resource is applied after the module resource.

**3. Items 3 and 7 together**
- The two dashboard steps were done in one operator block after item 6 and before the probe, with a read-only check script (07).

**4. Item 4's command**
- `--workdir "$W" --yes` were added, because stdin is empty and the CLI otherwise searches upward for a `supabase/` folder.

**5. Wait mechanics**
- Each plant re-read its served values after at least 20 s before going on (the 184-16 rule), and each ended with a read-only replan.
- The witnesses were polled up to 150 s instead of a flat 90 s wait. Both read after 10 s.

## Issues Encountered

**`functions.identity-callback-unverified` passed on the broken throwaway (SUPA-07 open).**
- The check calls `identity-callback` without `Authorization`, with only the publishable key in `apikey`, and fails on a gateway 401.
- After the Management API `PATCH` (status 200), the function was listed with `verify_jwt` true at version 5, both at once and 29 minutes later. Yet both of the probe's calls reached the function, which answered its own 405 and 500.
- 184-12 measured the gateway's 401 for an `apikey`-only call with the **legacy anon key** only.
- **Possible causes, UNCONFIRMED:** (1) the gateway admits a publishable key in `apikey` without `Authorization`, so the check cannot fail with the ruled key; (2) the metadata `PATCH` does not reach the serving gateway.
- **Distinguishing measurement**, while the fault is still planted and before 184-19 reverts it: the same `GET` once with the legacy anon key in `apikey` alone and once with the publishable key in `apikey` alone. Then either change the check (under 1) or re-plant by deploying with `verify_jwt` true (under 2), and run the probe again to see this one check fail.
- Logged in `deferred-items.md` and in the broken-windows ledger as an unmet truth.

**`auth.redirects` names its fault by count, not by value.** The finding reads "holds 1 entry, expected the 2 …", and the planted value `planted.invalid` is not quoted. It fails by its own cause. The marker the plan lists for it does not appear.

## Known Stubs

None.

## Threat Flags

None. The faults were planted on the throwaway only: every script stops unless REF is `begckvkapaopoztbreqc`. No credential, address or IP is in any record (leak scan clean).

## Next

- Before 184-19's revert, make the distinguishing measurement above while `identity-callback` still lists `verify_jwt` true.
- 184-19's revert should expect the module settings resource to show as drift of the planted values. The documented `-replace=module.supabase.supabase_settings.this` still applies.

## Self-Check: PASSED

- FOUND: evidence/184-18-throwaway-break-red.md
- FOUND: 19a2d09e8 (an ancestor of HEAD)
- `git diff --quiet` on `apps/` and `config.toml`: 0
