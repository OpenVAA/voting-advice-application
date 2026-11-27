---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 23
subsystem: infra
tags: [infra, supabase, hosted, staging, persistent-project, conformance-probe, served-settings, key-model, security-transfer]
status: complete

requires:
  - "184-22: the persistent project bootstrapped, its first administrator and the smoke dataset (184-22-2, s20_check_seed_exit=0)"
  - "184-17: CATALOG_ROLE=postgres; the operator's ruling of 2026-11-09 that the probe uses the publishable key"
  - "184-20: the session pooler connection (aws-0, eu-north-1) and the persistent project's key model"
provides:
  - "The persistent project's green conformance run: status 0, 22 PASS, 0 FAIL, 0 COULD NOT RUN (criterion 5)"
  - "The persistent project's served settings read back key by key: 39 auth and 3 API settings, all as declared, SMTP included (criterion 2)"
  - "FUT-02 holds the observed key model of both projects (D-12)"
  - "TR-183-01, TR-183-02, AR-183-01 and AR-183-02 re-transferred to phase 187 (D-21)"
affects: [184-24, 184-25, 187, FUT-02]

actuals:
  tokens: 4405
  tasks: 3
  commits: 2
plan_head_before: 197b4c91d3b167b272a1ceaa701cd4b1644a92c1
plan_head_after: 5dc0a4786b529b854247244e89f92374119cb995

tech-stack:
  added: []
  patterns:
    - "Sitting scripts screen every printed line for an address, an IP or a key-shaped string, let only the sender's exact line through, and count what they withhold"
    - "The served-settings read-back withholds smtp_user and prints only whether it is set"

key-files:
  created:
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-23-persistent-probe-and-records.md
  modified:
    - infra/envs/staging/supabase/README.md
    - .planning/todos/pending/2026-10-11-migrate-to-supabase-publishable-keys-after-streams-merge.md
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/183-SECURITY.md

key-decisions:
  - "The served-settings table takes its declared column from the module's merge: hosted-settings.json, both hook groups (on in the tfvars), the rate-limit defaults (the root sets none), site_url and uri_allow_list built from public_origin, and the tfvars' smtp object; 39 keys, matching managed_auth_keys"
  - "FUT-02 records the staging dashboard's legacy keys as 'retiring early 2027', as the operator reported on 2026-11-11, with the banner text 184-20 recorded; no key value"

requirements-completed: [SUPA-07, SUPA-13, OBS-01]  # OBS-07's two checks (rows.read-whole, db.anon-timeout) also passed on the persistent project in this run; 184-25 owns marking it

duration: about 25 min, from attempt 184-23-1 (21:13:26Z) to the last commit; the sitting ran 21:16:04Z to 21:16:13Z plus the cleanup
completed: 2026-11-11
---

# Phase 184 Plan 23: The persistent project's probe, served settings and records Summary

**The conformance probe passed on the persistent project cofbsatfrdysyphajsky: status 0, twenty-two PASS lines, no FAIL and no COULD NOT RUN. Its 39 managed auth settings and 3 API settings were read back key by key and are all served as declared. FUT-02 now holds both projects' key model, and the four phase-183 security items point at phase 187.**

## Probe status

- `s23_probe_exit=0`, `s1_pass_lines=22`, `s1_fail_lines=0`, `s1_could_not_run_lines=0`, at 2026-11-11T21:16:04Z, from HEAD `197b4c91d` with no diff.
- Inputs: the publishable key as `SUPABASE_ANON_KEY`, the service-role key unset (`s1_service_role_unset=yes`), and the catalog role `postgres` through the session pooler.
- `no-seed`, `rows.read-whole` (the 1001 smoke nominations) and `functions.identity-callback-unverified` all passed.
- The probe wrote one line to standard error. It was not pasted, and the log directory that held it was removed. With status 0 and every check passing, it changed no verdict.
- The read-back answered `s4_auth_http=200` and `s4_api_http=200`. Every `api` and `auth` entry of `hosted-settings.json` is served as declared, and so are the four SMTP fields (`s2_smtp_as_declared=yes`). An SMTP user is set, and its value was withheld. Both OAuth flags read `false`.

## "Not yet observed"

No row is still open. The runbook's "Not yet observed" section lists nothing: every row phase 184 added has moved to "Observations" with its date. This plan added two dated rows there: the probe passing every check on the persistent project, and every managed setting served as declared, SMTP included.

## Pending todos (D-24)

No pending todo was folded into this phase. FUT-02 was appended to as D-12 requires, and no other todo was created.

## Task Commits

1. **Task 1: the operator's sitting.** No commit. The reply is stored as `184-23-1` (attempt `20261111T211326Z.197b4c91d`) under `OPERATOR_REPLY=received attempt=20261111T211326Z.197b4c91d plan=184-23 task=1 head=197b4c91d3b167b272a1ceaa701cd4b1644a92c1`. The screen accepted it on the first `put`.
2. **Task 2: green run, served settings, runbook rows.** `e50926705`
3. **Task 3: FUT-02 key model, security re-transfer.** `5dc0a4786`

## Files Created/Modified

- `evidence/184-23-persistent-probe-and-records.md`:
  - the green run, with its twenty-two lines and the note;
  - a three-column table of the served settings (key, declared, served), 39 auth rows and 3 API rows;
  - the dashboard's two switch names from 184-10.
- `infra/envs/staging/supabase/README.md`: two dated Observations rows.
- `.planning/todos/pending/2026-10-11-migrate-to-supabase-publishable-keys-after-streams-merge.md`: the section `## Observed key model (phase 184)`, which records:
  - the keys issued, the legacy-keys endpoint, the dashboard's legacy state and its early-2027 retirement, for both projects;
  - the call shapes the legacy anon key (`D12_LEGACY_ANON=works`), the legacy service-role key (`D12_SERVICE_ROLE=works`) and the publishable key were seen working for;
  - `D09_APPLIED=yes` and what it means for the migration;
  - that the todo is still queued.
- `183-SECURITY.md`:
  - TR-183-01 and TR-183-02 now say "Phase 187";
  - a dated re-transfer note was added in each of the two risk logs, naming all four items.

## Decisions Made

See the `key-decisions` field in the frontmatter.

## Deviations from Plan

**1. [Rule 2 - Missing critical functionality] The read-back holds back more than Step 12's filter does**
- **Found during:** Task 1, while writing the scripts.
- **Issue:** the runbook's filter drops only names ending in a secret word. `smtp_user` (an SES access key id) might have reached a line had it been managed.
- **Fix:** 02 withholds `smtp_user` and prints whether it is set. Every line is screened for an address, an IP or a key shape, the sender's exact line is let through, and the withheld lines are counted. Here `smtp_user` was not managed, and nothing was withheld.
- **Commit:** none (scratchpad scripts only).

**2. Probe path:** the instruction named `infra/scripts/probe/probe-hosted.mjs`. The runbook and the earlier green runs use `infra/scripts/probe-hosted.mjs`, and `infra/scripts/probe/` holds only its modules, so the scripts used the runbook's path.

## Issues Encountered

None. All three scripts exited 0, and 03 ran last.

## Next Phase Readiness

- Criterion 5 (the probe passes on the persistent project) and criterion 2 (the served settings equal the HCL) are observed.
- Phases 185 and 186 have a conformant persistent project with the smoke dataset.
- Phase 187 owns the four OIDC and plan-role security items.

## Self-Check: PASSED

- FOUND: evidence/184-23-persistent-probe-and-records.md
- FOUND: e50926705, 5dc0a4786 (both ancestors of HEAD)
- Plan verifies: Task 1 precondition exit 0, Task 2 both verifies exit 0, Task 3 verify exit 0
