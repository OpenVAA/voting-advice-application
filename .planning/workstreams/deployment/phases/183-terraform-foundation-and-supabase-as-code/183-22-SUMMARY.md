---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 22
subsystem: infra
tags: [terraform, supabase, import, plan-review, stop-rules]
status: complete

requires:
  - phase: 183-21
    provides: the throwaway project imported into the scratch root's local state, and the provider-read variable file
  - phase: 183-24
    provides: the failed first apply (status 400) and fix 55802a1bc, which made the first review void
provides:
  - "A plan of the corrected tree, saved as tfplan (SHA-256 b194262f78c57d4a342c2c07a7716aec964b049c0ab6a2b53ada76bac3fe032e) and kept for the rerun of plan 183-24"
  - "PLAN_REVIEWED=ok, bound to that checksum, in attempt 22-2 20261023T060339Z.dac5f0465: the go-ahead the rerun of plan 183-24 requires"
  - "Observations dated 2026-10-22 and 2026-10-23: ignoring database_password gives no project change on an imported project (assumption A1)"
affects: [183-24, 183-25]

actuals:
  tokens: 3000
  tasks: 2
  commits: 1
plan_head_before: dac5f0465307508db11de682ccfb779469ad9113
plan_head_after: e1f13433792f0385584bd26b656e7d45cd44ad6f

tech-stack:
  added: []
  patterns:
    - "A plan's go-ahead is a PLAN_REVIEWED line bound to the plan file's SHA-256; a new plan needs a new review"
    - "A rerun keeps the void attempt's record in the evidence file, and the Attempt: lines name the current attempts only"

key-files:
  created: []
  modified:
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-22-throwaway-plan-review.md

key-decisions:
  - "183-22 (rerun, 2026-10-23): the plan of the corrected tree passed all five stop rules. It has one in-place update of supabase_settings.this, 0 to destroy and no password line. PLAN_REVIEWED=ok holds for tfplan sha256 b194262f…fe032e only."
  - "183-22 (first attempt, 2026-10-22, void): its review of tfplan sha256 35d762b2…1289c8 is void, because that apply failed with status 400 and fix 55802a1bc changed the module."
  - "183-22: assumption A1 was observed twice on the imported project. ignore_changes = [database_password] gives no change to the project resource, so follow-up 183-R4 is not raised."

requirements-completed: []

duration: "rerun: 27min wall clock (2026-10-23T05:38Z to 06:05Z), most of it waiting for the operator; first attempt: 45min (2026-10-22T16:14Z to 16:59Z)"
completed: 2026-10-23
---

# Phase 183 Plan 22: First plan after the throwaway import, reviewed Summary

**Review: ok (rerun, 2026-10-23).** All five stop rules hold for the plan of the corrected tree, so there is a go-ahead. Nothing was applied. The go-ahead holds for that one `tfplan` file:

```
PLAN_REVIEWED=ok attempt=20261023T060339Z.dac5f0465 sha256=b194262f78c57d4a342c2c07a7716aec964b049c0ab6a2b53ada76bac3fe032e head=dac5f0465307508db11de682ccfb779469ad9113 root=scratch
```

The first attempt's review, of sha `35d762b2…1289c8`, is void. It is kept below.

## Why it was run again

Plan 183-24 applied the first reviewed plan, and the apply failed. The hosted API returned status 400 because it requires `OAUTH_SERVER_ENABLED` and `OAUTH_SERVER_AUTHORIZATION_PATH` together. Commit `55802a1bc` removed both `oauth_server_*` keys from the module. So the old plan no longer matched the tree, and its file had been removed. A new plan needed a new checksum and a new review.

## What happened (rerun)

### Task 1 (operator, attempt 22-1 `20261023T053848Z.dac5f0465`)

The operator made one plan in `infra/envs/scratch/supabase` at HEAD `dac5f0465`, and kept it as `tfplan`. The tree at that HEAD is the same as at `55802a1bc` outside `.planning/`. The operator pasted:
- `s1_plan_exit=0`
- the checksum `b194262f…fe032e`
- `s3_plan_line` lines: line 10, `# module.supabase.supabase_settings.this will be updated in-place`, and line 261, `Plan: 0 to add, 1 to change, 0 to destroy.`
- `s4_logs_removed=yes`

The `s3` pair arrived twice, with the same line numbers. That is one heading, not two resources. The orchestrator infers that step 3 was run or pasted twice; the operator has not confirmed it. The lines are stored as given, with a `note:` line.

The reply passed the `attempt.sh put` screen with no refusal.

### Task 2 (executor, attempt 22-2 `20261023T060339Z.dac5f0465`)

Each of the five stop rules holds:
1. No heading names the project resource.
2. No line names `database_password`.
3. Nothing is destroyed or replaced.
4. The settings resource has the only heading, as an update in place.
5. The plan exited 0.

## What this observes

- **Assumption A1 holds again (observed 2026-10-23).** The first attempt observed it on 2026-10-22, and the plan of the corrected tree shows it again. Follow-up 183-R4 is not raised.
- **Line numbers.** The summary line moved from line 265 to line 261. That fits the diff losing the two removed keys, but no setting value was seen.

**Not observed:**
- **Whether `max_rows` reached the project in the failed apply.** No `has changed` heading appeared, and step 3 prints no setting value. The plan is one in-place update either way, so no stop rule is affected. The apply's read-back will show the served value.
- **Which keys the settings diff holds.**
- **Whether the API accepts the two hooks** on a project with no hook functions (research F2). This shows at the apply.

## First attempt (2026-10-22, void)

- **Attempts:** 22-1 `20261022T161449Z.1d0e2d6d0` and 22-2 `20261022T165931Z.1d0e2d6d0`.
- **Plan:** `tfplan` sha `35d762b21b217cc2cd232fcdc347e8da13604ed69ec2cb60d4db0da92a1289c8`.
- **Pasted lines:** heading line 10, `supabase_settings.this will be updated in-place`, and summary line 265, `Plan: 0 to add, 1 to change, 0 to destroy.`
- **Review:** all five rules held, giving `PLAN_REVIEWED=ok … head=1d0e2d6d0bce8b21eac8a60a530be6b1d0f9ff34`.
- **Commits:** the evidence commit was `c9c4534cd`, and the summary commit was `258e9fc5f`.
- **Why it is void:** plan 183-24 applied that file on 2026-10-22, and the auth update was refused with status 400. The record is kept in the evidence file under "First attempt (void)".

## Deviations from Plan

The commands are the plan's own. The orchestrator changed only how they were presented, as on the first attempt:
- **The secrets** were entered with the runbook's no-echo `read -rs` lines.
- **The blocks.** The sitting and step 1 were one block, and steps 2 to 4 were three separate blocks. The `cd` was given from the repository root by absolute path.
- **Step 3's regular expression** was split into three single-quoted parts, `P1`, `P2` and `P3`. The executor checked that it was byte-identical to the plan's pattern before it was handed out.

Two changes to the evidence file on the rerun:
- **The `Attempt:` lines.** The evidence file names only the current attempts on `Attempt:` lines. The first attempt's ids are kept as plain text, so a check reading the file finds one line per key.
- **A separate ledger.** The rerun's commit ledger is `gsd-plan-head-before-183-22-r2`, so the first attempt's ledger is left as it was.

## Next

Plan 183-24 runs again from Task 1, with a new 24-1 attempt. Its apply must name the checksum `b194262f78c57d4a342c2c07a7716aec964b049c0ab6a2b53ada76bac3fe032e`, and `bound 22-2 PLAN_REVIEWED=ok sha256=<that>` must exit 0 first.

`tfplan` is kept in `infra/envs/scratch/supabase`. It holds the project's settings and the database password in clear text, and the step that applies it removes it.

SUPA-11 stays open until plan 183-27.

## Self-Check: PASSED

- **Evidence file:** FOUND `evidence/183-22-throwaway-plan-review.md`. It names `Attempt: 22-1 20261023T053848Z.dac5f0465` and `Attempt: 22-2 20261023T060339Z.dac5f0465`, which match the helper's `id` for both keys.
- **Commit:** FOUND commit `e1f13433792f0385584bd26b656e7d45cd44ad6f`, an ancestor of HEAD.
- **Verify commands:** both of Task 2's verify commands exit 0. Attempt 22-2 holds exactly one `PLAN_REVIEWED=` line.
- **Secrets:** no file this rerun wrote holds a token, a password or an e-mail address.
