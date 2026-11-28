---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 19
subsystem: infra
tags: [infra, supabase, hosted, throwaway, conformance-probe, drift-check, revert, storage-policies]
status: complete

requires:
  - "184-18: the batched break left planted on the throwaway, the red run, and the keyless identity-callback calls"
  - "184-17: the green run before the break (22 PASS, exit 0), CATALOG_ROLE=postgres"
provides:
  - "The throwaway begckvkapaopoztbreqc back at its declared state: every fault of 184-18 reverted, and checked"
  - "The green run after the red one: 22 PASS, s23_probe_exit=0; the first green run with the keyless identity-callback calls"
  - "A clean drift check (s7_drift_exit=0) after the seven private-assets storage.objects policies were restored"
  - "Measured: the -replace revert plan's exact lines under Terraform 1.16.5, and an empty second plan"
  - "Measured: the replaced settings resource leaves keys the module does not send (the two OAuth flags)"
  - "Observed: after the bucket was deleted in the dashboard and its row inserted again, its seven storage.objects policies were missing (cause UNCONFIRMED)"
affects: [184-20, 184-22]

actuals:
  tokens: 4100
  tasks: 2
  commits: 2
plan_head_before: f537e2a2fa2a2b93461cfc88e2846b271d1f7fca
plan_head_after: 3e67c51728eebc7037505a3c2185cc48e01a4ccc

tech-stack:
  added: []
  patterns:
    - "A revert plan compared by sorted resource headings and the Plan: line, with a heading's own '(because ...)' reason line printed but not compared"
    - "Migration statements re-run on a hosted project by content-anchored extraction (from the CREATE POLICY \"<name>\" line to its semicolon), counted, guarded by a none-exist check, in one transaction"
    - "Repeated named-line prefixes of reruns renamed (s7a_, s7b_, s8a_) in the stored reply, so only the last run carries the plan's names"

key-files:
  created:
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-19-throwaway-revert-green.md
  modified:
    - infra/envs/staging/supabase/README.md
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/deferred-items.md

key-decisions:
  - "The OAuth server flags are reverted by a Management API update of /config/auth that sends both flags false with oauth_server_authorization_path, because the module sends neither flag and the API refuses the flags without the path"
  - "The private-assets bucket's seven storage.objects policies are restored from the initial migration's own CREATE POLICY statements, in one transaction, after the drift check found them missing"
  - "The green probe run (12:55:24Z, before the policy restore) stands without a rerun: no probe source reads a storage policy, so no verdict depends on the restored policies"
  - "The planted user was deleted by SQL matched on the seed's domain, printing only counts, instead of in the dashboard (orchestrator direction)"

requirements-completed: [SUPA-07]

duration: about 70 min, from the Task 1 attempt id (12:51:55Z) to the record; the sitting ran from 12:53:29Z to 13:00:28Z plus the drift check
completed: 2026-11-11
---

# Phase 184 Plan 19: The revert of the batched break, the green probe and the clean drift check Summary

**The rehearsal on the throwaway is complete.** Every fault of 184-18 is reverted, the conformance probe passes all 22 checks and exits 0, and the drift check exits 0. The throwaway went green (184-17), then red by every planted fault (184-18), then green again here.

This needed two reverts the plan did not have:
- **The OAuth server flags:** the module does not send them, so the replaced settings resource left them on.
- **The seven `storage.objects` policies of the `private-assets` bucket:** they were missing after the bucket was deleted in the dashboard and its row inserted again. The probe passed while they were missing, and only the drift check saw it.

## Performance

- **Sitting:** 2026-11-11, 12:53:29Z to about 13:03Z. It was run by the orchestrator under the operator's authorisation of 2026-11-10, with credentials from the operator's keychain.
- **Tasks:** 2 of 2.
- **Files:** 1 created, 2 modified.

## Accomplishments

- **Settings revert:** the `-replace` plan's lines were exactly the rule's (`Plan: 1 to add, 0 to change, 2 to destroy.`), so it was applied. The served values read as declared after 20 s, and the second plan read "No changes".
- **Other reverts:**
  - the bucket row inserted again (`s2_bucket_rows=2`);
  - the three functions redeployed as declared, with `identity-callback` at `verify_jwt` false (version 6) and a keyless GET answering 405;
  - the hook function renamed back, and `anon` at `8s`;
  - the planted user deleted (`s5_seed_domain_users=0`).
- **The green run:** 22 PASS, exit 0, no override. `no-seed` and `functions.identity-callback-unverified` passed.
- **The drift check:** red twice, on seven missing policies. It was clean after `02b` restored them.
- **The record:** the evidence file with every revert and the `## Green run` section, and five dated Observations rows in the runbook. The runbook's "Fault steps" now has the revert's plan lines, the OAuth flags the module does not send, and the bucket-policy lesson.

## Task Commits

1. **The missing policies, the probe coverage gap and the runbook lesson (deferred item):** `3da43eb0a` (docs)
2. **Task 2, the evidence and the runbook:** `3e67c5172` (docs)

Task 1 was the operator checkpoint and made no commit. Its reply is stored in attempt `184-19-1`.

## Decisions Made

See `key-decisions`. No operator ruling was needed: the revert plan matched the rule as written.

## Deviations from Plan

**1. [Rule 1 - Bug] The plan's settings revert would leave the OAuth server on**
- **Found during:** writing the Task 1 scripts.
- **Issue:** `-replace=module.supabase.supabase_settings.this` re-sends only the keys the module manages. `oauth_server_enabled` and `oauth_server_allow_dynamic_registration` are not among them, so the planted `true` would stay (threat T-184-57).
- **Fix:** script `01b` sent a PATCH of `/config/auth` with both flags `false` and the authorization path. It answered 200, both flags read `false` after 20 s, and a plan afterwards read "No changes".
- **Left over:** `oauth_server_authorization_path` stays `/oauth/consent`. No check reads it.

**2. [Rule 1 - Bug, unplanned step] The bucket's storage policies were missing after the bucket revert**
- **Found during:** Task 1, item 7. The drift check exited 1 twice with a 488-byte diff of seven `drop policy` statements on `storage.objects`.
- **Issue:** the seven `private-assets` policies of `00001_initial_schema.sql` were missing. The likely cause is that the dashboard delete in 184-18 dropped them and the row insert did not recreate them. This cause is UNCONFIRMED.
- **Fix:** script `02b` took the seven statements from the migration by content, checked that exactly seven were found and that none existed, and ran them as postgres in one transaction. Afterwards it counted 7 named policies, 15 in all on `storage.objects`, and the drift check was clean.
- **Runbook lesson:** a bucket fault's revert restores the bucket's policies too, and is checked with the drift check.
- **Follow-up:** a probe check of the storage policies, recorded in `deferred-items.md` (a coverage gap of D-17).

**3. [Orchestrator direction] The planted user was deleted by SQL, not in the dashboard**
- It was matched on the seed's domain and printed counts only. The script printed `answer_planted_user=deleted` once the domain held no user.

**4. Smaller deviations**
- **Order:** the green probe ran before the policy restore. It stands, because no probe source reads storage policies (`grep` checked in attempt `184-19-2`).
- **The record's prefixes:** the orchestrator ran the first cleanup before reading the first diff, so the drift check was rerun. In the stored reply, the earlier runs are renamed `s7a_`, `s7b_` and `s8a_`, so only the final runs carry `s7_` and `s8_`.
- **The fallback:** `03b`, the `verify_jwt` fallback, was not needed and did not run.

## Issues Encountered

- `account-access` stayed at version 6 through the deploy of all three functions. Why is UNCONFIRMED; the CLI may skip an unchanged bundle.

## Known Stubs

None.

## Threat Flags

None. The two added reverts restore the declared state: the OAuth server is off again, and the bucket's row-level policies are back. Every script stops unless REF is `begckvkapaopoztbreqc`. No key, address or IP is in any record (leak scan clean).

## Next

- **184-20 and 184-22:** the throwaway is at its declared state, so they can rely on it.
- **The deferred probe check of `storage.objects` policies:** decide whether it belongs in this phase.

## Self-Check: PASSED

- FOUND: `evidence/184-19-throwaway-revert-green.md`
- FOUND as ancestors of HEAD: `3da43eb0a`, `3e67c5172`
- Task 1 and Task 2 verifies exit 0
