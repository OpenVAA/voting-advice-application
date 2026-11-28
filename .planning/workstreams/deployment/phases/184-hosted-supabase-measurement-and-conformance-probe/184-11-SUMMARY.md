---
phase: 184-hosted-supabase-measurement-and-conformance-probe
plan: 11
subsystem: infra
tags: [infra, supabase, hosted, throwaway, terraform, smtp, migrations, drift, rls, observations]
status: complete

requires:
  - "184-10: the reviewed first scratch plan (sha256 9ea24b40…bf63e94) and the throwaway's first reads"
  - "184-04: push-migrations.sh and check-drift.sh --target linked"
provides:
  - "The throwaway begckvkapaopoztbreqc holds the frozen baseline 00001, the SMTP settings (both settings resources) and seven function secrets"
  - "Dated evidence of the first push to a hosted project: refusal, push, a clean drift check, owners, buckets, bypass readings"
  - "The hook-on, function-absent sign-in measured: 500 unexpected_failure"
  - "Ten dated runbook Observations rows; four Not-yet-observed rows settled"
affects: [184-12, 184-13, 184-15, 184-17]

actuals:
  tokens: 15241
  tasks: 3
  commits: 1
plan_head_before: 47b7e784898fdfef15fb061417e507757080b1aa
plan_head_after: 2a74a55aece255907a7336290ae1acc674d9ded7

tech-stack:
  added: []
  patterns:
    - "Drift-check report lines are pasted as `s16_report=` lines, because raw `check-drift.sh:` lines fail the attempt screen's named-line rule"
    - "psql output is printed only when its status is 0, so a connection error that names an address never reaches a paste"

key-files:
  created:
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-11-throwaway-apply-and-push.md
  modified:
    - infra/envs/staging/supabase/README.md
    - .planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/deferred-items.md

key-decisions:
  - "check-drift.sh keeps the CLI's default schema set for --target linked: a clean hosted database gave an empty diff (2026-11-09/10)"
  - "Sign-in on a project is broken (500 unexpected_failure) from its first settings apply until its migrations are pushed, while the access-token hook is on"
  - "The CLI's read-only login role does not bypass RLS and cannot count storage.buckets; postgres bypasses RLS (input for 184-17's catalog role)"

requirements-completed: []  # SUPA-01 (repeatable), SUPA-02, SUPA-04 and SUPA-05 close on the persistent project's live runs and the function deploy, not on this throwaway sitting

duration: about 25 min of agent work across two runs (checkpoint 2026-11-09, resume 2026-11-10)
completed: 2026-11-10
---

# Phase 184 Plan 11: The throwaway's first settings apply, the first push, and the reads after it Summary

**The push and the drift check were clean.** The frozen baseline `00001` was pushed to the throwaway with `push_status=0`. Then the drift check gave `CLEAN` with the CLI's default schema set: the history equals the manifest and the diff is empty. So `check-drift.sh` is not narrowed.

**Connection paths.** psql could not resolve `db.begckvkapaopoztbreqc.supabase.co` in this sitting (`could not translate host name`; one AAAA record and no A record). It used the session pooler on port 5432 (`s15_connection=pooler`), although the direct connection worked in 184-10. The CLI's own path printed as `unknown`. The wrapper's markers do not occur in CLI 2.118.0, which is now a deferred item.

**Bypass readings.** `postgres` has `rolbypassrls=t`. The CLI's read-only login role `cli_login_supabase_read_only_user` has `rolbypassrls=f`, and as that role `select count(*) from storage.buckets` failed (exit 1, cause UNCONFIRMED).

## Performance

- **Duration:** about 25 min of agent work. The checkpoint was raised at 2026-11-09T09:36:58Z and the reply was received at 2026-11-10T10:15Z.
- **Completed:** 2026-11-10
- **Tasks:** 3 of 3
- **Files modified:** 3

## Accomplishments

- **Settings apply.** The reviewed plan's checksum matched. Its apply imported the project and set the function secrets, then failed on the API settings with a 500. An orchestrator-reviewed retry plan, `2 to add`, sha256 `84433c45…3273`, applied with exit 0, and the second plan was empty.
- **SMTP.** The first SMTP enablement was accepted: host, port `2587`, sender and sender name are served as declared, and `smtp_user` is set. The two settings resources sit side by side, each with its own keys.
- **Function secrets.** Exactly the seven names the module sets: `PUBLIC_PROJECT_ID`, `SITE_URL`, `SMTP_FROM/HOST/PASS/PORT/USER`.
- **Hook-on, function-absent sign-in.** It answered **500**, `unexpected_failure`, `Error running hook URI: pg-functions://postgres/public/custom_access_token_hook`. In the dashboard both hooks were enabled. This closes the must-have that 184-10 handed to this plan.
- **Wrapper refusal and push.** Given the persistent ref, the wrapper refused with exit 2 and pushed nothing. The CLI followed the linked directory's symbolic links on the push.
- **Pushed database.** `postgres` owns `accounts`, `app_settings`, `deployment_settings`, `projects` and `storage_config`, and can read `auth.users`. The buckets are `private-assets:false` and `public-assets:true`, created by the migration on a hosted project.
- **Runbook.** It gains ten dated Observations rows. The four Not-yet-observed rows that this sitting settles are gone: side-by-side settings, the default schema set, the first SMTP enablement, and the hook-absent sign-in. The symbolic-link row is narrowed to the deploy.

## Task Commits

1. **Task 1: the operator's sitting.** A human-action checkpoint, so there is no commit. The reply is stored under attempt `184-11-1 20261109T093658Z.c8607274d`, with `OPERATOR_REPLY ... head=47b7e7848… sha256=9ea24b40…`.
2. **Task 2: evidence and runbook rows.** Commit `2a74a55ae`.
3. **Task 3: the drift check's schema set.** No file changed, so there is no commit. `s16_drift_status=0` means the default set is empty on a clean hosted database, dated 2026-11-09/10. Its checks passed: `bash -n` passed, `checkDriftLinkedGuard.test.ts` passed 13 of 13, and the parity guard exited 0.

## Decisions Made

- **The drift check's schema set stays the default.** This is per the plan's rule for a clean diff. Plan 184-13's planted-function check runs against the default set.
- **The hook-absent sign-in failure is recorded as a finding, not fixed.** It is inherent to the deploy order (settings before migrations), and the runbook now records it.

## Deviations from Plan

### Operator-reported (relayed by the orchestrator, 2026-11-10)

**1. The first apply failed partway.**
- **Found during:** Task 1, item 2.
- **Issue:** `s2_apply_exit=1`. `supabase_settings.this` got a 500 from the Management API: "Postgrest config update did not succeed within the expected time frame". The import and the function secrets were applied first. A GET of `/postgrest` showed the three API values in place.
- **Cause:** UNCONFIRMED, probably a platform timeout while PostgREST restarts.
- **Effect on the check:** the plan's check line `s2_apply_exit=0` cannot exist. The Task 2 check was run with `s2b_apply_exit=0`, the retry, in its place.

**2. The retry plan was reviewed by the orchestrator.**
- The operator made a new plan holding only `settings.this` and `smtp_secret[0]` (`Plan: 2 to add, 0 to change, 0 to destroy.`, stop words 0, sha256 `84433c4535f8b87a5d45581af2b7713fec9ed43a9cfc2ec3393c6e2a02713273`).
- The orchestrator reviewed it against the 184-10 Task 3 stop rules, with the expected list narrowed to those two resources.
- The operator applied it with exit 0, and the second plan showed No changes.

**3. The direct connection failed, and the sitting used the session pooler.**
- **Issue:** `s15_direct_exit=2`, `could not translate host name`. `dig` found 1 AAAA record and 0 A, and an IPv6 default route exists.
- **Cause:** UNCONFIRMED, possibly the system resolver and `dig` treating an IPv6-only name differently.
- **How the sitting went on:** the operator ran item 12 once, which removed the first `$L`, then made a fresh one. Items 7 to 11 ran over `aws-0-eu-west-1.pooler.supabase.com:5432` as `postgres.<ref>`.
- **Dates:** the direct connection worked in 184-10 (2026-11-08/09) and failed here (2026-11-09/10).

**4. `s16_push_connection=unknown`, and a gap in the wrapper.**
- **Issue:** the line was printed while the workstation needed the session pooler.
- **What I found:** a byte search of the installed CLI 2.118.0 bundle finds neither `Resolved DNS` nor `Using connection pooler`, the two markers `push-migrations.sh` greps for. The bundle's fallback is the stderr warning `... does not support IPv6. Retrying via the IPv4 connection pooler.`, so the wrapper prints `unknown` on every path.
- **Disposition:** logged to `deferred-items.md`. The script is not in this plan's files, and no real `--debug` log was kept to fit a direct-path marker to.

**5. Item 11b ran more than once.**
- **Issue:** a paste mishap. The first call answered 201, and a repeat printed no status line. Item 11c used the role answer present at that moment, and it connected.
- **Result:** `s11_readonly_count_exit=1`. The cause is UNCONFIRMED, possibly a permission denial on `storage.buckets`. This is recorded as a finding for 184-17's catalog role.

**6. The bucket booleans read `false`/`true`.**
- **Issue:** text concatenation of a boolean gives its full spelling, so psql printed `false`/`true` instead of `f`/`t`.
- **Fix:** the Task 2 check pattern accepts both forms.

**7. Two lines did not come back, and one answer came from a screenshot.**
- There is no `s3b_claim_names` line, because the sign-in was not 200.
- The hooks answer comes from an operator screenshot.
- The `s16b_` rerun and item 9 were not run: the push was clean and the drift status was 0.

**8. No `s18_platform_secret_name` line came back.**
- Runbook Step 18 says the secrets list also holds the platform's `SUPABASE_` names.
- It is UNCONFIRMED whether that command printed nothing or was not run. The runbook text is left alone.

### Executor additions to the operator commands (Rules 2 and 3)

**9. The commands shown at Task 1 differ from the runbook's in these ways:**
- **Added guard lines:** `s0_ref` and `s0_docker_exit`.
- **The secret names were split** into `s18_secret_name` and `s18_platform_secret_name`, so that the check's count of seven was not inflated.
- **The drift-check report** is printed as `s16_report=` lines. Rule 3: the raw `s16_check-drift.sh:` lines would have failed screen rule 1.
- **The Step 16 rerun was moved** to `$L/push2`, with `s16b_` lines.
- **The per-step logs-removal items were dropped**, so that the logs stay until item 12.
- **psql output that can carry an error** is printed only on status 0.
- **Lines added for the record:** `s7_refusal`, `s7_stdout_lines`, `s11_readonly_role`, the read-only query exits and `s11_restored_user`.

---

**Total deviations:** 8 operator-reported or found, 1 group of executor additions.

**Impact:** every must-have was observed. The apply needed a second, reviewed plan file. The CLI's connection path is unresolved.

## Issues Encountered

None beyond the deviations above.

## Deferred Issues

- `push-migrations.sh` connection markers do not exist in CLI 2.118.0 (deferred-items.md, "From 184-11").

## User Setup Required

None. The throwaway now holds `00001`, the SMTP settings and the function secrets. The linked work directory `tmp/supabase-linked/begckvkapaopoztbreqc` is kept for later sittings.

## Next Phase Readiness

- **184-12 onward:** use the session pooler from this workstation, or recheck the direct connection first. Expect sign-in to fail with 500 on any project between its settings apply and its push.
- **184-13:** the drift check runs with the default schema set. The planted function must turn it to exit 1.
- **184-17:** the catalog role cannot be the CLI's read-only login role. It has `rolbypassrls=f` and cannot count `storage.buckets`, while `postgres` has `rolbypassrls=t`.
- **Persistent-project apply:** a 500 from the PostgREST update may recur. The retry path, a new plan of the unapplied resources read against the stop rules, worked.

## Self-Check: PASSED

- `evidence/184-11-throwaway-apply-and-push.md` is present. It names `Attempt: 184-11-2 20261110T101613Z.47b7e7848` and contains `push_status`.
- `infra/envs/staging/supabase/README.md`: `prettier --check` exit 0.
- Commit `2a74a55ae` is an ancestor of HEAD.
- The Task 2 checks pass:
  - the reply is bound to the current attempt
  - `answer_applied=yes`, `s2b_apply_exit=0`, `s3_second_plan_exit=0`, `s7_wrong_ref_exit=2`, `s16_push_status=0` and `s12_logs_removed=yes` are present
  - the two bucket lines are present
  - there are seven `s18_secret_name=` lines
- The Task 3 checks pass: `bash -n`, the spec (13 of 13) and the parity guard (exit 0).
- The secret scan of the evidence file finds no JWT, `sb_`/`sbp_` key or IPv4 address. The only address is the sender's, and the disposable user's address appears in no file.
