---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 14
subsystem: infra
tags: [aws, account-inventory, iam, inline-policy, ses, infra-17, operator-checkpoint]
status: complete

requires:
  - phase: 183-12
    provides: "infra/scripts/account-inventory.sh (inventory, assert modes, self-test)"
  - phase: 183-13
    provides: "the finished, locally validated roots the inventory is compared against"
  - phase: 183-01
    provides: "tools/attempt.sh (attempt files, reply screen, bound checks)"
provides:
  - "evidence/183-14-account-inventory.md: the dated (2026-10-21) non-secret inventory of 471112560111, the operator's rulings on 183-R1/R2/R3, the Task 2 decision and a Consequences section for each of the seven kinds of finding"
  - "infra/envs/staging/dns-mail/terraform.tfvars: manage_account_suppression = false"
  - "infra/bootstrap/README.md: the first Observations row"
affects: [183-16, 183-17, phase-183-verification]

estimate:
  tokens: 42000
  tasks: 3
actuals:
  tokens: 4010     # chars/4 over the changed lines of the realized diff (16040 chars)
  tasks: 3
  commits: 3       # MEASURED: git rev-list --count plan_head_before..HEAD at SUMMARY write

plan_head_before: e6023911189defc550615b974e1cf2633b5bd7a8
plan_head_after: 1d90d8eada7f170458d88e81d309dc05b95e6a40

tech-stack:
  added: []
  patterns:
    - "A screen exemption is a whole-line, anchored match of a script's fixed output forms that skips one token only; every other name and rules 3 to 5 still apply"

key-files:
  created:
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-14-account-inventory.md
  modified:
    - infra/scripts/account-inventory.sh
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/tools/attempt.sh
    - infra/envs/staging/dns-mail/terraform.tfvars
    - infra/bootstrap/README.md

key-decisions:
  - "183-R1 ruled: Terraform is applied by hand through an IAM Identity Center permission set using the AWS-managed AdministratorAccess"
  - "183-R2 ruled per-session (alert address never tracked); 183-R3 ruled keep (DMARC reports to dmarc_agg@vali.email)"
  - "user-2's inline policy s3-static-media-access converted to a customer-managed policy by the operator; assert mode then exited 0"
  - "manage_account_suppression = false in staging dns-mail: other SES identities in eu-north-1 share the account-level setting"
  - "attempt.sh screen rule 2 exempts exactly the inventory's seven fixed verdict forms (operator ruling 2026-10-21, option (a))"

metrics:
  duration: "about 5 h wall clock (2026-10-21T08:19Z to 13:17Z), almost all of it waiting on the operator"
  completed: 2026-10-21
---

# Phase 183 Plan 14: Account inventory and INFRA-17 account clause Summary

No blocker for plan 183-16: the inventory of account 471112560111 on 2026-10-21 found no OIDC provider, hosted zone, SES staging identity, state bucket or same-named entity to collide with, the one IAM user with an inline policy was converted, and the assert mode then exited 0.

## Operator rulings

- **183-R1:** `identity-center`. The applying identity is the permission-set role `AWSReservedSSO_AdministratorAccess_db367c2a46e6e25b`, which uses the AWS-managed `AdministratorAccess` and carries no inline policy.
- **183-R2:** `per-session`. The budget alert address is given as `TF_VAR_alert_email` each session and is not tracked. `infra/bootstrap/terraform.tfvars` stays unchanged.
- **183-R3:** `keep`. DMARC aggregate reports go to `dmarc_agg@vali.email`, and the `dmarc_report_address` line stays.
- Other answers: credits `no`, immutable OIDC subjects `no` (the subject strings stand), repository move `no`, Cloudflare records at or under `staging`: `none`.
- Terraform 1.16.5 is installed on the operator's workstation (`s2_terraform=Terraform v1.16.5`), along with versions for jq, aws, dig, curl, shasum and git.

## INFRA-17 account clause

It is clean as of 2026-10-21. The assert mode first exited 1, because `user-2` carried the inline policy `s3-static-media-access`. The operator decided `convert` and moved the permission to a customer-managed policy. The re-run printed `s5b_assert_users_exit=0` and `assert: PASS: 2 IAM users, none with an inline policy`. INFRA-17 is **not** marked complete in REQUIREMENTS: plans 183-16, 183-17 and 183-21 still list it.

The decision record is `OPERATOR_DECISION=convert attempt=20261021T113817Z.df495bf05 user=user-2`. It carries the inventory's label `user-2`, not the IAM user name the plan's criterion asks for. The inventory prints no user name outside `/openvaa/`, and the executor never received the name. `bound 14-2 OPERATOR_DECISION=convert --where user=user-2` exits 0.

## Tasks

| Task | Name | Commit | Notes |
| ---- | ---- | ------ | ----- |
| 1 | Operator names the identity, installs Terraform 1.16.5 and runs the inventory | (checkpoint) | Reply stored in attempt `14-1 20261021T081907Z.e5728aa99`; `bound 14-1 OPERATOR_REPLY plan=14 task=1 account=471112560111` exits 0 |
| 2 | Decide what happens to each IAM user with an inline policy | (checkpoint) | Reply stored in attempt `14-2 20261021T113817Z.df495bf05` after the screen fix; decision `convert` for `user-2` |
| 3 | Record the inventory and adapt the code | 1d90d8ead | Evidence file, `manage_account_suppression = false`, README Observations row; no import block needed |

## Consequences drawn (Task 3)

- No OIDC provider for GitHub was present, so there is no `infra/bootstrap/imports.tf`.
- No hosted zone was present, so there is no delegation blocker.
- No `staging.openvaa.org` SES identity was present, so there is no `infra/envs/staging/dns-mail/imports.tf`.
- Other SES identities do exist in eu-north-1: domain `openvaa.org` and 1 address identity. That is why `manage_account_suppression = false` was set, even though the reasons were already `[BOUNCE,COMPLAINT]`.
- Nothing carries this project's names: no budget, repository or IAM entity, and no state bucket.
- The budgets call answered without an access error.
- The account is a member of an AWS Organization. An SCP could refuse a call made in 183-16 or later; none was observed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] The inventory printed a tag key shaped like an access key id**
- **Found during:** Task 1
- **Issue:** the console keys an access key's description tag by the access key id, and the inventory printed tag keys verbatim, so access key ids reached output meant for the record (the plan forbids recording one).
- **Fix:** `fmt_tags` prints such a key as `access-key-description`, and `scrub` masks any remaining AKIA/ASIA id as `redacted-key-id`, also in both assert modes; six new self-test cases (41 cases, 0 failed).
- **Files modified:** infra/scripts/account-inventory.sh
- **Commit:** 51ffaccaa

**2. [Rule 1 - Bug, operator-ruled] The reply screen refused the inventory's own verdict line**
- **Found during:** Task 2
- **Issue:** `attempt.sh put 14-2` refused line 5 (`class=secret-name`), the inventory's fixed verdict `s5b_inv=assert: PASS: …`, because it read `PASS` as a secret-word name. Nothing of that paste was stored.
- **Ruling:** on 2026-10-21 the operator chose option (a), a narrow exemption. The operator also confirmed in their own words that the refused line held no secret, so nothing needed rotating. This is recorded as `OPERATOR_REFUSAL_CONFIRMED=no-secret … line=5 class=secret-name` in the 14-2 attempt file.
- **Fix:** rule 2 no longer judges the `PASS`/`FAIL` token. This applies only when the whole line is a named result line whose value is exactly one of the seven verdict forms of `evaluate`: counts as digits, and path prefixes made only of `A-Z a-z 0-9 _ . -` segments. Every other name on the line, and rules 3 to 5, are judged as before. The helper's header documents the exemption and the ruling.
- **Tests:** the helper's self-test grew from 187 to 233 checks, all passing. 7 verdict forms are accepted. 8 look-alikes are still refused: `pass:`, `assert: PASS: hunter2`, a trailing `password:`, lower-case `pass:`, a field named `password`, an `answer_` line, a prefix holding `pass:`, and an access-key-shaped prefix (refused as token-shape).
- **Files modified:** .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/tools/attempt.sh
- **Commit:** 8936b9dca

**3. [Documented] The decision record carries the label `user-2`, not the IAM user name** (see INFRA-17 above).

## Observed, not acted on

- One IAM group, `AWSSESSendingGroupDoNotRename` (the SES console's SMTP group), carries the inline **group** policy `AmazonSesSendingAccess`, and `user-1` is a member. The assert mode judges users only, so INFRA-17's user clause is unaffected. Whether a group inline policy matters for the phase's "no permission depends on an inline policy" reading is left to the operator and the phase verifier.
- The inventory did not cover the customer-managed policy the operator created for the conversion, so its name and path are not observed.

## Verification

- Task 3 verify 1: `terraform fmt -check -recursive infra` plus init and validate of bootstrap and staging dns-mail, both reporting "Success! The configuration is valid." Exit 0.
- Task 3 verify 2: the no-inline guard reported 0 findings over 42 `.tf` files. Every named line was present in 14-1, the 14-3 attempt holds `## Consequences`, `183-R2: per-session` and `Credits: no`, the evidence file names `Attempt: 14-3 20261021T131347Z.8936b9dca`, and the scan for addresses and session names was clean. Exit 0.
- Task 3 verify 3: `bound 14-1 OPERATOR_REPLY …` exit 0.
- Inventory: `bash -n` and `--self-test` give 41 cases, 0 failed. Helper `--self-test`: all cases passed.
- `prettier --check infra/bootstrap/README.md` is clean after formatting the new table row.

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-14-account-inventory.md
- FOUND: 51ffaccaa, 8936b9dca, 1d90d8ead (ancestors of HEAD)
