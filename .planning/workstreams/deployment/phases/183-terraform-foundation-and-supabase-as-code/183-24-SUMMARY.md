---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 24
subsystem: infra
tags: [terraform, supabase, throwaway-apply, hosted-settings, parity-guard]
status: stopped

requires:
  - phase: 183-22
    provides: the review PLAN_REVIEWED=ok for tfplan sha256 35d762b2...
provides:
  - The observation that the hosted API refuses an auth update holding the two OAuth-server switches without the authorization path (status 400, 2026-10-22)
  - A module and guard that no longer send or compare oauth_server_enabled and oauth_server_allow_dynamic_registration
affects: [183-22, 183-24, 183-25, 183-27, phase-184]

actuals:
  tokens: 5300
  tasks: 1
  commits: 1
plan_head_before: 258e9fc5fc59c1e686b9b0d016e32c8361edd769
plan_head_after: 55802a1bc3380915b55357c7afebc742c21e6171

tech-stack:
  added: []
  patterns:
    - "A key the hosted API refuses goes back to not compared, with the date and the API's reason, and the plan is reread before any new apply"

key-files:
  created:
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-24-throwaway-apply.md
  modified:
    - infra/modules/supabase/hosted-settings.json
    - scripts/assert-hosted-settings-parity.mjs
    - scripts/fixtures/hosted-settings-parity/hosted-settings.max-rows-49999.json
    - infra/envs/staging/supabase/README.md
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/deferred-items.md

key-decisions:
  - "Fix A, approved by the operator: oauth_server_enabled and oauth_server_allow_dynamic_registration are removed from hosted-settings.json and the fixture, and the guard puts them back in not compared. The authorization path was not added."
  - "Phase 184's conformance probe reads the two OAuth-server switches from /config/auth. The module and the guard no longer cover them."

requirements-completed: []

duration: 12h31m wall clock (2026-10-22T17:04Z to 2026-10-23T05:35Z), most of it waiting for the operator
completed: 2026-10-23
---

# Phase 183 Plan 24: Throwaway apply Summary (stopped)

**Plans 183-22 and 183-24 are to be run again from their first task. Wave B may not continue until then.**

**The apply of the reviewed plan failed.** The hosted API refused the auth update with status 400: "Both OAUTH_SERVER_ENABLED and OAUTH_SERVER_AUTHORIZATION_PATH must be provided together when updating OAuth configuration".

- **Correction:** commit `55802a1bc`. The module no longer sends the two OAuth-server switches, and the guard no longer compares them.
- **The hook's outcome for phase 184 is still not observed.** The API stopped at the OAuth check, so it never decided on the access-token hook or the send-email hook. The next apply shows it.

## Performance

- **Started:** 2026-10-22T17:04Z
- **Stopped:** 2026-10-23T05:35Z
- **Tasks:** 1 of 2 run.
  - Task 1 (the operator's apply) ended with `answer_applied=error`.
  - Task 2 ran its stop path only.
- **Files:** 5 modified, 1 created.

## Accomplishments

- **The apply was tied to the reviewed plan file.** The operator printed checksum `35d762b2…89c8` before applying, which is the checksum the 183-22 review names. `bound 24-1 OPERATOR_APPLIED sha256=<that>` exits 0.
- **The failure was diagnosed to the key.**
  - From the provider's source: the provider sends the whole planned `auth` JSON, so both OAuth-server switches (`false`) went out and no authorization path did.
  - The operator's `s2_oauth_name` lines confirmed that the API's message names `OAUTH_SERVER_AUTHORIZATION_PATH`.
- **The correction was made and checked.**
  - The JSON and its fixture lost the two keys.
  - In the guard, the two local keys went back to "not compared" with the dated reason, and their embedded case was removed. Census: must agree 24, not compared 35. Self-test: 66 cases.
  - The runbook's OAuth row moved to "Observations".
  - These checks all pass: the guard, the self-test, the types check, the guard's spec, Prettier, fmt and validate.
- **The follow-up for phase 184 is in `deferred-items.md`:** the SUPA-07 probe reads `oauth_server_enabled` from `/config/auth`.

## Task Commits

1. **Task 1: the operator applies.** This was a checkpoint, with no commit. The reply is in attempt 24-1 (`20261022T170532Z.258e9fc5f`), under `OPERATOR_APPLIED=error … sha256=35d762b21b217cc2cd232fcdc347e8da13604ed69ec2cb60d4db0da92a1289c8 head=55802a1bc3380915b55357c7afebc742c21e6171`.
2. **Task 2: the stop path.**
   - `55802a1bc` fix: the two OAuth-server keys are not sent; the guard and runbook follow.
   - The docs commit holds the evidence, this SUMMARY and the deferred item.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The two OAuth-server keys could not be applied as sent**
- **Found during:** Task 1, step 2 (the apply).
- **Issue:** the hosted API requires `oauth_server_enabled` and the authorization path together. The module sent the switch without the path.
- **Fix:** both switches were removed from the managed set, and the guard does not compare them. This is the plan's own bullet for OAuth keys that are not accepted. The operator approved it as fix A.
- **Files modified:** `hosted-settings.json`, its fixture, the guard, the runbook.
- **Commit:** `55802a1bc`

### Process

- **Two orchestrator-added diagnostics.** While `$L` still held the apply log, the operator ran two read-only filters over it that are not steps of the plan:
  - `s2_error_detail`: redacted lines of the error;
  - `s2_oauth_name`: the `OAUTH_SERVER_` names in the log.
  Both are stored with a `note:` line on their provenance.
- **`fix=A` is stored as `answer_fix=A`,** because the screen accepts only named and answer lines.
- **The 24-1 reply was stored after the fix commit,** so its `head=` is `55802a1bc`. The orchestrator asked that the reply not be stored until the fix was approved.
- **Flags from the checkpoint, for the rerun of this plan:**
  - The plan's general rule says "a status not 0 means stop", but steps 5 and 6 must be non-zero. The operator should be told that `s5` non-zero and `s6=2` are expected, and to continue to step 7.
  - Step 5 prints only a count. Task 2, and a must-have, want the refusal text verbatim. The proposed extra line is `grep -i -E 'cannot be destroyed|prevent_destroy' "$L/s5.log" | sed 's/^/s5_refusal_line=/'`, which passes the screen.
  - The execution rules and T-183-66 still describe a header file. The commands pass the token on curl's standard input.
- **STATE.md was not changed.** Plan 183-20 is paused, and this plan has stopped, so no plan was advanced and no progress was recorded.

## Issues Encountered

- **Possibly half-applied (not observed).** The provider updates the API settings before the auth settings and saves no state on the error. So `max_rows` may already be 50000 on the throwaway project. If it is, the next plan reads that value on refresh and shows only the auth update. No stop rule is affected.

## Known Stubs

None.

## Next Phase Readiness

1. **Plan 183-22 runs again from Task 1:** a new plan of the corrected tree, a new checksum, and a new review in 22-2.
2. **Then plan 183-24 runs again from Task 1,** with a new 24-1 attempt and the new reviewed checksum.
3. **Plan 183-25 waits for that rehearsal to pass.**

**SUPA-11 stays open** until plan 183-27.

## Self-Check: PASSED

- FOUND: the evidence file `evidence/183-24-throwaway-apply.md`. It holds `Attempt: 24-1 20261022T170532Z.258e9fc5f` and `Attempt: 24-2 20261023T053522Z.55802a1bc`, which match the helper's `id` for both keys.
- FOUND: commit `55802a1bc` is an ancestor of HEAD.
- FOUND: `bound 22-2 PLAN_REVIEWED=ok sha256=<X>` exits 0, and `bound 24-1 OPERATOR_APPLIED=error sha256=<X>` exits 0.
- **The plan's Task 2 verify commands 1 and 2 fail, as the plan intends for a stopped run.** They require `OPERATOR_APPLIED=yes` and the served values. Commands 3 and 4 pass.
