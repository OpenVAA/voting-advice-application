---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 10
subsystem: infra
tags: [infra, supabase, hosted, throwaway, terraform, import, logging, api-keys, observations]
status: complete

requires:
  - "184-07: the scratch root's import block keyed on var.project_ref"
  - "184-09: runbook Steps 15 and 19, the sitting lines, the named-line contract"
provides:
  - "Reviewed first scratch plan: PLAN_REVIEWED=ok sha256=9ea24b40518b08b3487fe531606be51639e054bb489f403a2fdc50bd8bf63e94 ref=begckvkapaopoztbreqc (attempt 184-10-3 20261109T092844Z.033621371); the operator keeps that tfplan for 184-11"
  - "Dated reads of the recreated throwaway before any change: direct connection, seven logging settings, key model, dashboard switch names, hook-off sign-in"
  - "Runbook Observations rows for these reads; the hook-on sign-in row re-pointed at the window between the first settings apply and Step 16"
affects: [184-11, 184-12, 184-15, 184-16]

actuals:
  tokens: 10400
  tasks: 3
  commits: 4
plan_head_before: b6efa7d00fde054f9c3ce95e407faf92f6c9b0f2
plan_head_after: f72003660d40269ac4362a24996fcfc4167f6609

tech-stack:
  added: []
  patterns:
    - "A superseded, never-run attempt is retired by appending a `note: superseded ... not run` line to its file and opening a new attempt; nothing is deleted"
    - "A 40- or 64-hex value in an attempt-file line is carried only in a field whose name ends in head/commit/sha (40) or sha256 (64); any other name is refused by the screen"

key-files:
  created:
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-10-throwaway-reads.md
  modified:
    - infra/envs/staging/supabase/README.md

key-decisions:
  - "Scratch state is restored by re-import through the root's import block (`reimport`), ruled by the operator 2026-11-08"
  - "The first scratch plan (sha256 9ea24b40…bf63e94) matches the expected reimport list exactly and is reviewed ok; 184-11 applies only that file"
  - "The hook-on/function-absent sign-in (F2 runtime half) was not observable on the recreated blank project; it moves to 184-11, between the settings apply and the migration push"

requirements-completed: []  # SUPA-13 (works for every call shape) and OBS-01 (served auth settings) close only on later live sittings; SUPA-02 closes with the applies

duration: about 20 min of agent work across three resumes (2026-11-08 Task 1 checkpoint and Task 2 issue/reissue; 2026-11-09 Task 3)
completed: 2026-11-09
---

# Phase 184 Plan 10: The throwaway's first reads and its first scratch plan, reviewed Summary

**The review is `ok`. The recreated throwaway's first scratch plan reads exactly `1 to import, 3 to add, 0 to change, 0 to destroy`, with the expected four addresses, and the checksum `9ea24b40518b08b3487fe531606be51639e054bb489f403a2fdc50bd8bf63e94` is the one 184-11 may apply. psql reaches the database directly (`s15_connection=direct`). No successful statement is logged with its parameters, but a statement slower than 10 s would be, through `auto_explain.log_min_duration=10s` with `auto_explain.log_parameter_max_length=-1`. That is the D-10 gate 184-15 decides.**

## Performance

- **Duration:** about 20 min of agent work. The operator's sitting ran from 2026-11-08T19:30:57Z to 2026-11-09T09:28:44Z.
- **Completed:** 2026-11-09
- **Tasks:** 3 of 3
- **Files modified:** 2

## Accomplishments

- **Task 1 ruling:** `reimport`, ruled by the operator on 2026-11-08 and stored under attempt `184-10-1 20261108T190840Z.b6efa7d00`.
- **Throwaway reads (`begckvkapaopoztbreqc`), before any change:**
  - The direct connection works.
  - The seven logging settings are `ddl, -1, -1, none, off, 10s, -1`.
  - Key model: legacy `anon` and `service_role` are issued and enabled, alongside `publishable/default` and `secret/default`. `/api-keys/legacy` answers 200 with `enabled=true`. The dashboard shows the legacy keys' retirement as "early 2027".
  - The switch labels, verbatim: "Allow new users to sign up" and "Confirm email". They sit under Authentication > Sign In / Providers, in the User Signups panel, and both are on. The project has no hook.
  - The disposable user was created. A password sign-in returned 200 with the publishable key as `apikey`.
- **First scratch plan:** reviewed against the stop rules, and the `PLAN_REVIEWED=ok` line was written.
- **Runbook:**
  - Seven dated Observations rows.
  - The throwaway halves of the connection and logging rows, and the key-model row, left "Not yet observed".
  - The hook-on sign-in row now names its real window.

## Task Commits

1. **Task 1: How the scratch root gets its state back.** A decision, no commit, since no tracked file changed (as in 184-08). The ruling lives in attempt file `184-10-1` and in the evidence file.
2. **Task 2: The operator reads the throwaway and makes the first scratch plan.** A human-action, no commit. The reply is stored under attempt `184-10-2 20261108T193057Z.b047f448b`.
3. **Task 3: Record the reads, review the scratch plan, move the runbook's rows.** `f72003660` (docs)

`commits: 4` is measured as `b6efa7d00..f72003660`. Three of those commits are the orchestrator's, made during the plan:
- `b047f448b`: new scratch ref
- `923187123`: AWS profile in the sitting lines
- `033621371`: scratch region `eu-west-1`

One commit is this executor's: `f72003660`.

## Files Created/Modified

- `.planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-10-throwaway-reads.md`: the dated reads, the ruling, the replacement of the project, and the plan review.
- `infra/envs/staging/supabase/README.md`: Observations rows and "Not yet observed" edits. Prettier also re-flowed both tables' column widths.

## Decisions Made

- **`reimport` (ruled by the operator, 2026-11-08).**
- **Review verdict `ok`.** The five plan lines, sorted, equal the expected list (`diff` exit 0). There is no destroy, no replacement, no project creation and no password line.
- **F2 runtime half not observed here.** The recreated project has no hook, so the sign-in was a hook-off baseline. I did not mark the truth "a sign-in while the hook is on and its function absent" as observed. The runbook row now points at the window between the first settings apply (184-11) and Step 16.

## Deviations from Plan

### Operator-reported

**1. The throwaway project was replaced (2026-11-08)**
- **Found during:** Task 2, before any item ran.
- **Issue:** the operator found `suxeqyhafjueinxnojge` already deleted and created `openvaa-scratch`, ref `begckvkapaopoztbreqc`, in the staging organisation.
- **Fix:** the orchestrator's commit `b047f448b` changed the scratch tfvars `project_ref`, updated plans 184-10 to 184-25, and added a 184-CONTEXT amendment. I retired the first `184-10-2` attempt (`20261108T192033Z.b6efa7d00`) with a `note: superseded ... not run` line, opened `20261108T193057Z.b047f448b`, and reissued only the differences.
- **Reissue changes:** no pause question, and expected `s6_signin_http=200` because there is no hook. I added `answer_hooks_state=` and `answer_anon_kind=`.

**2. The recreated project is in `eu-west-1`, not `eu-north-1`**
- **Found during:** Task 2, item 7.
- **Issue:** the first plan proposed `~ region = "eu-west-1" -> "eu-north-1"` (`1 to import, 3 to add, 1 to change`, sha256 `35345ac30924787f24eefd0d793f95ab6c448c4da3a192a438c425cd6b4a2569`). It was stopped and never applied, and its tfplan was removed (`s7_old_plan_removed=yes`).
- **Fix:** the orchestrator's commit `033621371` set the scratch `region` to `eu-west-1`. The reviewed plan was made on that tree. The attempt id names `b047f448b`, and the OPERATOR_REPLY line records `plan_commit=033621371…`. Staging stays in `eu-north-1`.

**3. Item 6's first try returned 400 `invalid_credentials`**
- A retry with the same user and the password from the manager returned 200. The cause is UNCONFIRMED, probably a mistyped password at the prompt.

**4. Two lines were not printed or were renamed in the reply**
- Item 3's optional `s19_out_lines` line was not printed. All seven settings are present.
- The plan lines came back named `s7_line=` rather than `s7_plan_line=`. The named-line check of Task 3 does not depend on that name.

**5. `answer_anon_kind=publishable`**
- The operator used the publishable key as `SUPABASE_ANON_KEY` although a legacy `anon` key exists. The sign-in shows that the auth endpoint accepts it.
- Later plans whose user_setup says "the legacy anon key" (184-12 onward) should state which key they want.

### Executor additions to the operator commands (Rule 2)

**6. Item 7's grep was widened**
- Runbook Step 3's `database_password|must be replaced|will be destroyed|forces replacement` were added, split over `-e` arguments, so that the stop rule "any password line" could be read. The reply's lines show no such line.

**7. Item 4 prints `s4_list_http=`**
- This prints the status of the `/api-keys` read.

**8. Steps 15 and 19 kept their own last items**
- Each step keeps its `logs_removed` item, with the runbook's command for making `$L` again in between.

**9. Screen-safe record lines**
- The first `put` of the Task 2 reply was refused by the screen (`line 1 class=token-shape`): I had put a 40-hex commit id under `plan_tree=`. I renamed it to `plan_commit=` and moved the old plan's checksum into an `old_plan_sha256=` field. No reply value was changed.

---

**Total deviations:** 5 operator-reported, 4 executor additions. **Impact:** the plan's must-have on the F2 runtime half is unmet in this plan and is handed to 184-11. Everything else is as specified.

## Issues Encountered

None beyond the deviations above.

## User Setup Required

The operator keeps `infra/envs/scratch/supabase/tfplan` (sha256 `9ea24b40…bf63e94`) for 184-11's apply. Any new plan needs a new review.

## Next Phase Readiness

- **184-11:** apply exactly the reviewed file. Then, before the migration push, make one password sign-in with the disposable user. That observes the hook-on/function-absent case, which 184-10 could not, and needs the orchestrator to amend 184-11.
- **184-15:** the D-10 gate is likely to fire. `auto_explain.log_min_duration=10s` with `auto_explain.log_parameter_max_length=-1` would log a statement slower than 10 s with its parameters. Whether `auto_explain` is loaded in the bootstrap's session is not settled by this read.
- **SUPA-13:** both key models are live on a November 2026 project. The legacy keys are enabled, and the dashboard shows their retirement as "early 2027".

## Self-Check: PASSED

- `evidence/184-10-throwaway-reads.md`: present. It names `Attempt: 184-10-3 20261109T092844Z.033621371`.
- `infra/envs/staging/supabase/README.md`: `prettier --check` exit 0.
- Commit `f72003660` is an ancestor of HEAD.
- Task 3's first `<automated>` check (bound reply, required named lines, seven `s19_setting.` lines, `PLAN_REVIEWED` with the new ref) exit 0. The second (evidence names the current attempt, Prettier) exit 0.
- Secret scan of the evidence file for `@`, IPv4, `eyJ`, `sb_secret_`/`sb_publishable_`: no match. The disposable user's address appears in no file.
