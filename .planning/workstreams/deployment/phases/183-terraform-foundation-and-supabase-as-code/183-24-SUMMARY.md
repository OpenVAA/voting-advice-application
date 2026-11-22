---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 24
subsystem: infra
tags: [terraform, supabase, throwaway-apply, hosted-settings, parity-guard, prevent-destroy]
status: complete

requires:
  - phase: 183-22
    provides: the review PLAN_REVIEWED=ok for tfplan sha256 b194262f78c57d4a342c2c07a7716aec964b049c0ab6a2b53ada76bac3fe032e (second attempt)
provides:
  - The throwaway project's settings applied from the HCL, with the second plan empty (status 0)
  - Every managed key (34 auth, 3 API) seen served as intended
  - The destroy plan's refusal status (1) and text, as observed
  - The red control (status 2)
  - Both hooks seen accepted by the hosted API before their functions exist
  - The two OAuth-server keys out of the module and the guard, after the hosted API refused them (status 400)
affects: [183-23, 183-25, 183-27, phase-184]

actuals:
  tokens: 12950
  tasks: 2
  commits: 6
plan_head_before: 258e9fc5fc59c1e686b9b0d016e32c8361edd769
plan_head_after: 51d7ff0385100301e1ec7f559cc42a8b87ec7ca3

tech-stack:
  added: []
  patterns:
    - "A refused apply ends the plan; the correction is committed, and plans 183-22 and 183-24 run again from their first task with a new checksum and review"
    - "The read-back compares each intended value, as JSON, with the served named line; a value that is not served is a difference"

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
  - "Fix A (approved by the operator): oauth_server_enabled and oauth_server_allow_dynamic_registration are no longer sent or compared. The hosted API requires OAUTH_SERVER_ENABLED and OAUTH_SERVER_AUTHORIZATION_PATH together (status 400, 2026-10-22). Phase 184's probe reads the two switches."
  - "Both hooks were accepted before their functions exist, so the persistent root applies with both switches on. No hook off until assignment is needed, and phase 184 pushes the migrations before anyone signs in."
  - "password_required_characters is served as an empty string, not null, so the second plan empties with it."

requirements-completed: []

duration: 13h33m wall clock (2026-10-22T17:04Z to 2026-10-23T06:37Z), most of it waiting for the operator and for the rerun of 183-22
completed: 2026-10-23
---

# Phase 183 Plan 24: Throwaway apply Summary

**Wave B may continue. The rehearsal passed on the throwaway project on its second attempt.**

- **The apply.** The reviewed plan file (SHA-256 `b194262f…032e`) was applied with status 0.
- **The second plan** exited 0 with no changes.
- **The read-back.** All 37 managed keys are served as intended.
- **The destroy plan** exited 1, naming `module.supabase.supabase_project.this` and `prevent_destroy`.
- **The red control** exited 2.

**The hooks' outcome for phase 184:** the hosted API accepted both hooks before their functions exist. So the persistent root (183-25) applies with both hook switches on, and phase 184 does not switch them on. What phase 184 must do is push the migrations before anyone signs in. How the auth service behaves while the functions are missing was not observed.

**The first attempt (2026-10-22) stopped.** Its apply was refused with status 400 because the module sent the OAuth-server switches without the authorization path. Commit `55802a1bc` removed those keys, and plans 183-22 and 183-24 ran again from their first task.

## Performance

- **Started:** 2026-10-22T17:04Z (first checkpoint)
- **Completed:** 2026-10-23T06:37Z
- **Tasks:** 2 of 2, on the second attempt
- **Files modified:** 5, and 1 created

## Accomplishments

- **The apply was tied to one reviewed plan file, in both attempts.**
  - Each time, the operator printed the plan file's checksum before applying.
  - Each time it equalled the checksum of the then-current `PLAN_REVIEWED=ok` line of 22-2.
  - Task 2's first verify passes on the current attempt: `bound 24-1 OPERATOR_APPLIED=yes sha256=b194262f…`.
- **Read-back: 37 of 37 equal, 0 different, 0 missing, no extra.**
  - **Intended values:** the JSON's `api`, `auth`, `auth_hook` and `auth_send_email_hook` groups; `site_url` and `uri_allow_list` from `https://staging.openvaa.org` and the two redirect paths; the six rate limits at the module's defaults.
  - **Settled:**
    - `password_required_characters` is served as `""`, not null.
    - The redirect list comes back exactly as sent: comma-joined, with no space, in the sent order.
    - The two MFA TOTP switches (`false`) and `mailer_otp_length` (`6`) equal the module.
- **The refusal is on record verbatim.** It is three lines, `Error: Instance cannot be destroyed` among them, and the status is 1.
- **The runbook (`a9418645d`):**
  - Eight statements moved from "Not yet observed" to "Observations", each dated.
  - Two statements stay unobserved: two settings resources side by side, and no own mail while the send-email hook is on.
  - The hook trap now says that the apply does not fail, and that the migrations go before any sign-in.
- **`deferred-items.md` has two phase-184 items:**
  - the probe reads the OAuth-server switches;
  - the hooks are on before their functions, so the migrations come before any sign-in.

## Task Commits

**First attempt (stopped, 2026-10-22):**

1. **Task 1** was a checkpoint and has no commit. Its reply is in 24-1 attempt `20261022T170532Z.258e9fc5f`, with `OPERATOR_APPLIED=error`.
2. **Task 2**, the stop path:
   - `55802a1bc` fix: the two OAuth-server keys are not sent; the guard and the runbook follow.
   - `dac5f0465` docs: the stop record.

**Second attempt (passed, 2026-10-23), after the 183-22 rerun (`e1f134337`, `8f89f0e63`, not this plan's):**

1. **Task 1** was a checkpoint and has no commit. Its reply is in 24-1 attempt `20261023T060657Z.8f89f0e63`, with `OPERATOR_APPLIED=yes`.
2. **Task 2:**
   - `a9418645d` docs: the runbook's observations and the hook trap.
   - `51d7ff038` docs: the evidence, with the first attempt kept as history, and the deferred items.

`commits: 6` is measured from the ledger base `258e9fc5f`. Two of the six are the 183-22 rerun's, which landed between this plan's two attempts. Four are this plan's. The final metadata commit adds one more.

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The hosted API refused the two OAuth-server keys as sent**
- **Found during:** Task 1, first attempt, step 2.
- **Issue:** the response was status 400: "Both OAUTH_SERVER_ENABLED and OAUTH_SERVER_AUTHORIZATION_PATH must be provided together when updating OAuth configuration". The provider sends the whole planned `auth` JSON, so both switches went out with no path.
- **Fix:** both keys were removed from the JSON and the fixture, and the guard puts them back in "not compared" with the dated reason. Their embedded case was removed. This is the plan's own bullet, approved by the operator as fix A.
- **Files modified:** `hosted-settings.json`, the fixture, the guard, the runbook.
- **Commit:** `55802a1bc`

**2. [Rule 2 - Correctness] The runbook's hook trap described a failure that does not happen**
- **Found during:** Task 2, second attempt.
- **Issue:** the trap said the apply fails when a hook's function is missing. The API accepts the hook.
- **Fix:** the trap now says the apply succeeds and the migrations must be applied before anyone signs in. The `hook off until` path stays, for a failure that names a hook.
- **Files modified:** `infra/envs/staging/supabase/README.md`
- **Commit:** `a9418645d`

### Process (orchestrator rulings and provenance)

- **Orchestrator-added diagnostics.** In the first attempt, the operator ran `s2_error_detail` (redacted error lines) and `s2_oauth_name` (the `OAUTH_SERVER_` names) over the apply log. In the second, the orchestrator added `s5_refusal_line`, the matching lines of the destroy plan, because step 5 printed only a count and the plan wants the text. Each is stored with a `note:` line.
- **Orchestrator rulings for the second attempt:** a non-zero `s5` and `s6=2` are expected, so continue to step 7; if `s3` is 2, run step 4 before step 7; on a hook failure, stop with the `s2_error` lines and step 7. None of these branches was taken.
- **`answer_applied` was relayed as `yes`.** The operator typed `answer_applied=ye`, and the orchestrator read it as `yes`. `s2_apply_exit=0` and the `Apply complete!` line agree, and the reading is recorded in a `note:` line.
- **`fix=A` is stored as `answer_fix=A`,** because the screen accepts only named and answer lines.
- **Delivery.** The commands were given in five blocks. The long filters, the addresses, the header `printf` and the step 5 ERE were built in shell variables and checked byte-identical to the plan.
- **Wording that does not match the commands.** The plan's general "a status not 0 means stop" contradicts steps 5 and 6. Its execution rules and T-183-66 also describe a header file, while the commands pass the token on curl's standard input. The runbook's commands are unaffected. Flagged here for the persistent run of 183-25, which has the same steps.

## Issues Encountered

- **Not observed:** whether `max_rows` reached 50000 in the failed apply of 2026-10-22 or in the second attempt. It is served as 50000.
- **Plan 183-20** is untouched and still paused. STATE.md's current plan stays at 20.

## Known Stubs

None.

## Threat Flags

None. No new endpoint, auth path or trust boundary was added. The two Management API reads are the ones the plan names, made by the operator with the token on standard input.

## Next Phase Readiness

- **Plan 183-23 can proceed:** the persistent project, its import and its first plan.
- **Plan 183-25** applies with both hook switches on, and its runbook steps 11 to 13 are those rehearsed here. It carries the same two wording flags as above, and would benefit from the same `s5_refusal_line` capture.
- **When the rehearsal is no longer needed,** the runbook's last step of the rehearsal applies: delete the throwaway project in the dashboard, and remove the scratch root's local state.
- **SUPA-11 stays open** until plan 183-27.

## Self-Check: PASSED

- FOUND: `evidence/183-24-throwaway-apply.md`. Its `Attempt: 24-1 20261023T060657Z.8f89f0e63` and `Attempt: 24-2 20261023T063404Z.8f89f0e63` lines match the helper's `id`.
- FOUND: commits `55802a1bc`, `dac5f0465`, `a9418645d` and `51d7ff038` are ancestors of HEAD.
- All four verify commands of Task 2 exit 0:
  - the bound and named lines;
  - every JSON key served as in the file;
  - the guard, self-test, types check, spec and Prettier;
  - fmt, validate and the `Attempt: 24-2` line.
