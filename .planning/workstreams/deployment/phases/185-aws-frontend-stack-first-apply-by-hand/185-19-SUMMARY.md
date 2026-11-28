---
phase: 185-aws-frontend-stack-first-apply-by-hand
plan: "19"
subsystem: infra
status: complete
tags: [terraform, destroy, aws, ecs, tagging-api, supabase, cleanup, runbook]
requires:
  - phase: 185-18
    provides: the observation rows on the persistent project, and the stack in its plain shape
provides:
  - The AWS root destroyed once, its state empty, and nothing tagged `Root=aws` left in either region
    except the INACTIVE ECS cluster and service, accepted as residue by the operator's ruling
  - The observation's user, invitation and seven feedback rows removed from the persistent project
  - The evidence log lines copied before the log group went
  - The image, both parameters, the zone, the execution role and an empty dns-mail plan, read after the destroy
affects: [185-20]
tech-stack:
  added: []
  patterns:
    - "A saved destroy plan is checked with `terraform show -json`, every change a delete and its addresses equal to the state's managed list, before it is applied"
    - "An INACTIVE ECS cluster or service stays in the Tagging API's index for hours after the destroy and cannot be deleted further: classified residue, not a leak"
key-files:
  created:
    - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-19-before-and-destroy.md
    - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-19-log-copy.md
  modified:
    - infra/envs/staging/aws/README.md
    - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/evidence/185-18-feedback-and-invitation.md
    - .planning/workstreams/deployment/phases/185-aws-frontend-stack-first-apply-by-hand/185-18-SUMMARY.md
key-decisions:
  - "Operator ruling B (2026-11-14): the INACTIVE ECS cluster openvaa-staging and service openvaa-staging-frontend, still listed six hours after the destroy, are accepted residue. delete-cluster and delete-service are what made them INACTIVE. This overrides the verify line SWEEP_AFTER_EU_NORTH_1=0 and Step 16 item 5's empty-search expectation. INFRA-10 reads as nothing listed except INACTIVE ECS records that cannot be deleted."
  - "The destroy was the apply of the checked saved -destroy plan, which is what terraform destroy runs after its prompt, so the applied plan is exactly the one whose count and addresses were checked"
  - "The phone's feedback row carried the operator's own text (10.43 eet) and was deleted by that text in a separate keyed delete. Step 13 item 4 now names the exact text."
requirements-completed: [SUPA-12, INFRA-10, INFRA-08]
duration: about 7 h wall clock (2026-11-14 09:05Z to 16:50Z), most of it the sweep and a host sleep; about 1 h of agent work
completed: 2026-11-14
estimate_ref:
  tokens: 24000
  tasks: 2
actuals:
  tokens: 6300
  tasks: 2
  commits: 3
plan_head_before: e46f956f9e1ec71742e9ab34b405b26cd4403b9b
plan_head_after: 49890bbe39250975e1ac1c5a9271d99ce891fe58
---

# Phase 185 Plan 19: The cleanup, the plans before, and one destroy of the AWS root Summary

```
DESTROY_EXIT=0
SWEEP_AFTER_EU_NORTH_1=2 (ecs:cluster openvaa-staging INACTIVE, ecs:service openvaa-staging-frontend INACTIVE)
SWEEP_AFTER_US_EAST_1=0
```

**The AWS root was destroyed once, cleanly.**
- The saved destroy plan read `Plan: 0 to add, 0 to change, 40 to destroy.`, equal to the state's 40
  managed resources, and its 40 deletes named exactly those addresses.
- Its apply exited 0 with `40 destroyed`, and the state is empty.
- `us-east-1` listed nothing tagged `Root=aws` from the first read after the destroy.
- In `eu-north-1` the five INACTIVE task definitions were deleted, and the stopped task and four
  already-deleted rules left the index.
- What stayed is the INACTIVE cluster and service. No call removes them, and the operator accepted
  them as residue.
- Everything outside the root survived:
  - the image (digest unchanged, equal to 185-12's);
  - both parameters;
  - the zone;
  - the execution role;
  - a `dns-mail` plan with no changes.

## Record lines

```
CLEANUP_COUNTS=0,0,0
SUPABASE_PLAN_BEFORE_EXIT=0
LOG_COPY_LINES=16
DNS_MAIL_PLAN_BEFORE_EXIT=0
ROOT_AWS_BEFORE=30,2
STATE_MANAGED_COUNT=40
DESTROY_PLAN_LINE=Plan: 0 to add, 0 to change, 40 to destroy.
DESTROY_PLAN_COUNT=40
DESTROY_PLAN_MATCHES_STATE=yes
DESTROY_EXIT=0
INACTIVE_TASK_DEFINITIONS_DELETED=5
SWEEP_AFTER_EU_NORTH_1=2 (ecs:cluster openvaa-staging INACTIVE, ecs:service openvaa-staging-frontend INACTIVE)
SWEEP_AFTER_US_EAST_1=0
IMAGE_SURVIVES=yes digest-unchanged=yes
PARAMETERS_SURVIVE=2
ZONE_SURVIVES=yes
ROLE_SURVIVES=yes
DNS_MAIL_PLAN_AFTER_EXIT=0
```

## What was done

- **Task 1 (checkpoint).**
  - Attempt `20261114T090516Z.e46f956f9` of key `185-19-1` was created at 09:05Z.
  - The operator ran the cleanup as `postgres` over the direct connection and the read-only plan
    of `envs/staging/supabase`.
  - The reply was stored (`put` exit 0) and bound (`bound` exit 0). The operator's `diag_` lines
    were stored as `s15d_`, the names the screen accepts.
- **Task 2.**
  - **The log copy (09:45Z):** 6 start-up events naming `ORIGIN`, 5 stop lines and 5 `SIGTERM`
    lines.
  - **The dns-mail plan before:** exit 0.
  - **The `Root=aws` counts:** 30 in eu-north-1 and 2 in us-east-1, by type.
  - **The state and the destroy plan:** 40 managed resources; the destroy plan matched in count and
    in addresses.
  - **Before the destroy:** the record was committed in 536bcdb6b.
  - **The destroy:** 09:49:11Z to about 09:53:50Z, in the background under `caffeinate -i`.
  - **The first search:** classified (see the evidence), then the five INACTIVE revisions deleted.
  - **Nine sweep reads, 09:54Z to 15:49Z.**
  - **The survivor reads and the dns-mail plan after:** exit 0.
  - **The state bucket:** listed read-only; only the pipeline key changed.
  - **The runbook:**
    - Step 13 item 4 names the exact text to type.
    - A note on copying blocks whole.
    - Step 16 names the accepted residue and the closed-lid sleep.
    - Seven "Not yet observed" rows became seven dated Observations rows.
    - Prettier is clean.
  - `$L` was removed.

## Commits

| Task | Commit | Message |
| ---- | ------ | ------- |
| 2 | 536bcdb6b | docs(185-19): record the cleanup, the log copy and the plans before the destroy |
| 2 | 2ec6325d0 | docs(185-19): record the destroy, the sweep so far and what survived |
| 2 | 49890bbe3 | docs(185-19): record the accepted sweep residue and the destroy's observations |

## Verification

| Check | Exit |
| --- | --- |
| Task 1 verify (`OBS06_INVITATION_ID=` on record) | 0 |
| Task 2 verify, literal | 1: `missing: SWEEP_AFTER_EU_NORTH_1=0`; every other line passes |
| Task 2 verify, with `SWEEP_AFTER_EU_NORTH_1=0` replaced by the ruled line | 0 |
| Prettier `--check` of `infra/envs/staging/aws/README.md` | 0 |
| Evidence grep for addresses, mailboxes, tokens | no match |

## Deviations from Plan

### Operator-ruled override

**1. [Operator ruling, decision B, 2026-11-14] Two INACTIVE ECS records stay in the Tagging API index**
- **Found during:** Task 2, the sweep.
- **Issue:** at the last read (15:49:06Z), about six hours after the destroy, `eu-north-1` still
  listed the cluster `openvaa-staging` and the service `openvaa-staging-frontend`, both `INACTIVE`.
  Research A2 and Pitfall 14 named only the task definitions. Nothing further deletes these two:
  `delete-cluster` and `delete-service` are what made them INACTIVE.
- **Ruling:** accept the two as classified residue. Record
  `SWEEP_AFTER_EU_NORTH_1=2 (ecs:cluster ..., ecs:service ...)`.
- **Consequence for the gates:** the literal verify exits 1 on `SWEEP_AFTER_EU_NORTH_1=0` alone. With
  the ruled line it exits 0.
- **Must-have truth not met as worded:** "the Tagging API lists no resource tagged `Root=aws` in
  `eu-north-1`". INFRA-10 now reads as "nothing listed except INACTIVE ECS records that cannot be
  deleted". The empty read in `us-east-1` holds as worded.
- **For 185-20:** the re-apply creates a cluster and a service under the same names. They become
  ACTIVE again, so this reading cannot be repeated after it.

### Operator-side events (not runbook defects)

- **The phone's feedback row was not a `limit-check` row.**
  - The cleanup deleted 6 `limit-check` rows, not 7.
  - The phone's row carried the operator's own text, `10.43 eet`, created at 08:43:41Z, which confirms
    the OBS-10 phone insert was stored.
  - A follow-up delete keyed on that description and on a creation time within the last day removed
    exactly 1 row. That row was the only feedback row of the last day.
  - 185-18's evidence and SUMMARY were corrected to the stored text.
  - Step 13 item 4 of the runbook now names the exact text, so the row is removed by Step 15 (Rule 1,
    a runbook defect: it had invited the operator's own text).
- **The first Supabase plan exited 1** with `Unable to read project, got status 401` (invalid access
  token). With a new token, the second plan exited 0 with `No changes`. This was a credential problem,
  not drift. Both runs are recorded.
- **Copy-paste losses.** Three times, a pasted block lost a line in the operator's terminal. The
  runbook's "What you paste back" now says to copy each block whole and to re-run the whole block when
  a named line is missing.

### Execution events

- **The host slept from 10:37:38Z to about 15:18Z** (`Clamshell Sleep`). `caffeinate -i` does not hold
  a closed lid awake. The gap only delayed reads, and Step 16 now says to keep the lid open.
- **The SSO session expired during the sweep.** Read 10 could not reach STS, so the loop stopped on its
  account check. By the ruling, no further AWS read was needed, and none was made after 15:49Z.
- **Adjacency (INFRA-10):**
  - The bootstrap root was not planned: its plan needs the operator's inputs.
  - The state bucket's key listing shows the three `hand/` objects unchanged by the destroy.
  - The `dns-mail` plan was empty before and after.
  - The `supabase` plan after is Step 16 item 7, the operator's, in plan 185-20.

## Known Stubs

None.

## Threat Flags

None. No new surface.
- T-185-43 held: only `envs/staging/aws` was destroyed, and its saved plan held no address outside its
  state.
- T-185-44 held: the deletes were keyed on the invitation id, the invitee's address and the
  `limit-check` marker, plus one keyed delete of the phone's row, and every count was read back.
- T-185-45 held: the log copy was written and committed before the destroy.

## Next Phase Readiness

Plan 185-20 can re-apply the root from the same commit and tag. The operator must first sign in again
with `aws sso login --profile openvaa-admin`: the session had expired at 16:40Z. Step 16 item 7, the
`supabase` plan and the conformance probe after the destroy, is still the operator's.

## Self-Check: PASSED

- FOUND: evidence/185-19-before-and-destroy.md with `DESTROY_EXIT=0`
- FOUND: evidence/185-19-log-copy.md with the `ORIGIN` refusal and the stop line
- FOUND: infra/envs/staging/aws/README.md (Prettier clean)
- FOUND: 536bcdb6b, 2ec6325d0, 49890bbe3
