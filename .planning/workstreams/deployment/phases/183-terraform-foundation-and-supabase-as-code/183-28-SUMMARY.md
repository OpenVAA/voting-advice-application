---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 28
subsystem: infra
tags: [terraform, runbook, ses, route53, cloudflare, supabase, docs]
status: complete

requires:
  - phase: 183-04
    provides: "infra/envs/staging/dns-mail and the mail-ses module whose outputs and identity the runbook reads"
  - phase: 183-05
    provides: "infra/modules/supabase (prevent_destroy, ignore_changes on the password, hosted-settings.json) and the scratch root"
  - phase: 183-07
    provides: "infra/envs/staging/supabase, the root the persistent-project steps run in"
  - phase: 183-10
    provides: "the auth_send_email_hook group, the enable_send_email_hook switch and password_min_length 8, named in the settings section"
  - phase: 183-12
    provides: "the runbook shape of infra/bootstrap/README.md, and infra/README.md, which already links to these two runbooks"
provides:
  - "infra/envs/staging/dns-mail/README.md: Steps 1 to 9, every operator command of 183-17, 183-18 and 183-19 word for word, a Return: line per step, ## Not yet observed (11 rows), ## Observations (header only)"
  - "infra/envs/staging/dns-mail/DELEGATION.md: the 2026-10-11 observation of the parent zone and a Type/Name/Content/Entered (UTC) table with four NS rows to fill"
  - "infra/envs/staging/supabase/README.md: rules of the root, rehearsal (Steps 1 to 7) and persistent project (Steps 8 to 13), every operator command of 183-21, 183-22, 183-24, 183-23 and 183-25 word for word, ## Settings and their guard, traps, ## Not yet observed (13 rows), ## Observations (header only)"
affects: [183-17, 183-18, 183-19, 183-21, 183-22, 183-23, 183-24, 183-25, 183-26]

estimate:
  tokens: 60000
  tasks: 2
actuals:
  tokens: 15587    # chars/4 over the three files this plan created (62347 chars)
  tasks: 2
  commits: 2       # MEASURED: git rev-list --count plan_head_before..plan_head_after

plan_head_before: ced7beb055598ef3b5727241be78ab3ace1e26fb
plan_head_after: 4194c9cd180101472c492780de177a78e8349abd

tech-stack:
  added: []
  patterns:
    - "Secrets of a session are read with `read -rs` and exported, so a token or password is on no command line, in no shell history and in no file"
    - "Runbook steps keep the checkpoint's item numbers, so items transcribed word for word keep their line names (Step 2 of the dns-mail runbook starts at item 6)"

key-files:
  created:
    - infra/envs/staging/dns-mail/README.md
    - infra/envs/staging/dns-mail/DELEGATION.md
    - infra/envs/staging/supabase/README.md
  modified: []

key-decisions:
  - "The token and the database password are read into the session with `printf '<prompt>: '; read -rs VAR; echo; export VAR`, checked under both zsh and bash. The checkpoint plans say only 'export for this session', and a literal `export VAR='<secret>'` would leave the secret in the shell's history"
  - "The dns-mail runbook's Step 6 adds two credential-free public-resolver checks (`dig +short NS` and `dig +short SOA` of the staging name at 1.1.1.1) beside the two commands of 183-18; what they should show is listed under Not yet observed"
  - "The Supabase runbook ends the rehearsal with a paragraph on deleting the throwaway project and the scratch root's local state files, because 183-21 asks for the state to be deleted with the project and infra/README.md says the root is removed with it"
  - "The SMTP credential outputs of the mail root are described and not named in the runbook, so the runbook never spells the password output's name"

requirements-completed: []  # INFRA-18 closes when 183-18 records the delegation in DELEGATION.md; SUPA-11 stays open until 183-21 to 183-27 have run. This plan writes the runbooks both rest on.

duration: 15min
completed: 2026-10-19
---

# Phase 183 Plan 28: The zone and mail root's runbook, the delegation record and the Supabase roots' runbook Summary

**Two operator runbooks that carry every command of the eight checkpoint plans word for word: a nine-step zone and mail runbook, and a thirteen-step Supabase runbook that runs every step on the throwaway project before the persistent one and makes the operator wait for a go-ahead between each plan and its apply. A separate `DELEGATION.md` holds the 2026-10-11 observation of the parent zone and four NS rows to fill in. Every cloud behaviour nobody has seen yet is listed under "Not yet observed".**

## Performance

- **Duration:** about 15 min (2026-10-19T06:00Z to 06:15Z)
- **Tasks:** 2/2
- **Files:** 3 created

## Accomplishments

- `infra/envs/staging/dns-mail/README.md` (412 lines). It has a flow diagram and a paste rule that says why: the apply log holds the access key id of the SMTP user. It includes the sitting lines and the warning that `$L` and `tfplan` hold secrets in clear text. The steps are:
  - Step 1: the apply.
  - Step 2: the four outputs by name, with a blockquote that the two SMTP credential outputs are never printed, and `get-email-identity` with the `SigningHostedZone` comparison.
  - Step 3: the second plan, both inventory assert modes, the SMTP user's policies and the state object's encryption.
  - Step 4: the corrected DKIM records, run only if needed.
  - Step 5: the four NS records at Cloudflare, pointing at `DELEGATION.md`.
  - Step 6: the `dig` checks.
  - Step 7: the wait for the identity to verify.
  - Step 8: `put-account-details`.
  - Step 9: `create-email-identity` for `<your-address>`.

  No step sends a test mail.
- `infra/envs/staging/dns-mail/DELEGATION.md`: the dated observation (two Cloudflare name servers, unsigned, `NXDOMAIN` for the staging name and names under it). It has a table of four NS rows whose Content reads "to be filled when the zone exists", one line saying public resolvers have not yet been seen answering, and what the record will also state once the records are entered.
- `infra/envs/staging/supabase/README.md` (677 lines):
  - **Rules:** nine rules, each with its reason.
  - **Rehearsal in `infra/envs/scratch/supabase`, Steps 1 to 7:** the token and the project; the two imports and the read through the filter; the first plan, saved; the wait for the go-ahead, with the five stop rules; the apply of the saved file; the second plan and the read-back, with the token passed to `curl` on stdin; the refused destroy plan; and the red plan with one variable changed.
  - **Persistent project, Steps 8 to 13:** the region decision and the creation; the import of the project only, the tfvars lines and the first plan; the wait for the go-ahead; the apply; the second plan and the read-back; the refused destroy plan and the state object. A blockquote says never to run `terraform destroy` here.
  - **Settings and their guard:** the five hosted groups, the four classes with one example each, and both hook switches.
  - **Traps:** four blockquotes, each naming its symptom.
  - **Tables:** Not yet observed with 13 rows, and Observations with its header row only.
- **Verify results**, each exit read straight from the command:
  - Task 1, second verify: 0. Every command of 183-17, 183-18 and 183-19 is present.
  - Task 2, both verifies: 0. Every command of 183-21, 183-22, 183-24, 183-23 and 183-25 is present.
  - `prettier --check infra/envs`: 0.
  - Task 1, first verify: see Deviation 1.
- **Hygiene:** neither file holds an e-mail address (an address grep over all three files found none) or the string `.planning`. Neither cites a planning id or a phase number. The only "183" is inside the transcribed `mktemp` template.

## Task Commits

1. **Task 1: The dns-mail runbook and the delegation record file**: `393036cb7` (docs)
2. **Task 2: The Supabase runbook**: `4194c9cd1` (docs)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug in the plan's check] Task 1's two verify commands contradict each other on `--user`**
- **Found during:** Task 1
- **Issue:** The first verify fails on any line matching `--user` (its `fails_when` says the target is a credential passed to `curl` on the command line). The second verify requires 183-17's commands word for word, and two of them are `aws iam list-user-policies --user-name …` and `aws iam list-attached-user-policies --user-name …`, which contain `--user`. No runbook can pass both checks as written: the first exited 1 on exactly those two lines.
- **Fix:** The transcription stays word for word, as the second verify and the plan's "one source for the commands" require. The first verify was run with its stated intent, `--user([ =]|$)` (curl's flag, not `--user-name`), and exited 0. The runbook contains no `curl` at all, and no line spells the CLI configuration push or the SMTP password output's name. The plan file was not edited. If 183-28's check is ever re-run as written, it will report these two lines.
- **Files modified:** none beyond the runbook
- **Commit:** `393036cb7`

**2. [Orchestrator note - 183-10 ruling] The send-email hook group and switch are in the Supabase runbook**
- **Found during:** Task 2
- **Change:** The settings section names the five hosted groups, `auth_send_email_hook` among them, and both switches, `enable_access_token_hook` and `enable_send_email_hook`. It also gives the `# hook off until <reason>` rule and the escape hatch `enable_send_email_hook = false # hook off until <reason>`. It states that while the send-email hook is on, the hosted auth service sends no mail of its own, so the SMTP settings and `rate_limit_email_sent` govern no mail it sends. The "Hosted may be stricter" example is `password_min_length`, 8 in both. A trap covers a hook switched on before its function exists. Two Not yet observed rows cover the send-email hook: whether it can be switched on before its function exists, and whether the hosted auth service then sends no mail of its own.
- **Commit:** `4194c9cd1`

### Gaps in the checkpoint plans, followed as written and noted here (not edited)

- **183-21, item 8:** the allow-list of the settings filter has `hook_custom_access_token_(enabled|uri)` but not the send-email hook's keys. The runbook transcribes the filter as written and adds a sentence: `hook_send_email_enabled` and `hook_send_email_uri` appear on `s8_auth_name=` lines by name only. Their values are seen in the read-back of Steps 6 and 12, because `managed_auth_keys` includes them.
- **183-24, item 6:** the red control changes `enable_access_token_hook` only. That is enough for the check (one variable changed must report a change), and the runbook follows it.
- **183-23, item 2:** it lists the three variables the operator adds to `terraform.tfvars`. The file already assigns `enable_send_email_hook = true` (from 183-10), which the runbook leaves untouched.

## Known Stubs

- `infra/envs/staging/dns-mail/DELEGATION.md`, table rows 1 to 4: Content reads "to be filled when the zone exists" and Entered (UTC) is empty. This is by design: the plan specifies these cells, and the values exist only after the operator applies the zone (183-17). They are filled when the delegation is recorded (183-18), and INFRA-18 closes then. They were not added to `.planning/WINDOWS.md`, because that ledger is the main project's ship gate and this placeholder has a named owner plan in this phase.

## Threat Flags

None. The files are documentation and add no endpoint, auth path or schema. The T-183-61 mitigations are in place:
- The Supabase runbook opens with the never-apply rules (destroy, replacement, password).
- Plan and apply are separated by a wait step in both sections.
- A blockquote forbids `terraform destroy` in the persistent root.
- The mail runbook never reads the SMTP credential outputs and has no `curl`.

## Next Phase Readiness

- Plans 183-17, 183-18 and 183-19 (mail) and 183-21 to 183-25 (Supabase) can point the operator at these runbooks.
- If any of those plans is revised, run this plan's second verify of the matching task again and bring the runbook back in line before the operator acts.
- `DELEGATION.md` is ready for 183-18 to fill in.

## Self-Check: PASSED

- FOUND: infra/envs/staging/dns-mail/README.md, infra/envs/staging/dns-mail/DELEGATION.md, infra/envs/staging/supabase/README.md
- FOUND commits on HEAD: 393036cb7, 4194c9cd1
