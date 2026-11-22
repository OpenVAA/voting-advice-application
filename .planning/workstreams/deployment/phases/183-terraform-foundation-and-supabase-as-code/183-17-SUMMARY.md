---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 17
subsystem: infra
tags: [aws, terraform, route53, ses, dkim, iam, infra-17, infra-18, operator-checkpoint]
status: complete

requires:
  - phase: 183-16
    provides: "the state bucket openvaa-tfstate-471112560111, which this root's backend names"
  - phase: 183-14
    provides: "the account inventory, 183-R1 (the applying identity), manage_account_suppression = false"
  - phase: 183-01
    provides: "tools/attempt.sh (attempt files, reply screen, bound checks)"
provides:
  - "staging/dns-mail applied in 471112560111 / eu-north-1: zone Z02494181MAM7OCUAIPKC, SES identity staging.openvaa.org, six mail records, SMTP user with the managed send policy; 14 resources"
  - "evidence/183-17-dns-mail-apply.md: the apply, the identity read, the DKIM zone comparison, the INFRA-17 account clause and public DNS before the delegation"
  - "DELEGATION.md with the four NS rows filled, not yet entered"
  - "17-2 attempt line `Second apply needed: no` for plan 183-18"
affects: [183-18, 183-19, phase-183-verification]

estimate:
  tokens: 40000
  tasks: 2
actuals:
  tokens: 6665     # chars/4 over the realized diff (26659 chars)
  tasks: 2
  commits: 2       # MEASURED: git rev-list --count plan_head_before..HEAD at SUMMARY write

plan_head_before: 27ed35730b0135278d804428c731164f6e025442
plan_head_after: fb5db2fca0f824dc0f45fd2aa7e1a063319e17fd

tech-stack:
  added: []
  patterns:
    - "An executor-side validate in a root the operator has initialised runs under a throwaway TF_DATA_DIR"

key-files:
  created:
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-17-dns-mail-apply.md
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/deferred-items.md
  modified:
    - infra/envs/staging/dns-mail/README.md
    - infra/envs/staging/dns-mail/DELEGATION.md
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/183-17-PLAN.md

key-decisions:
  - "The DKIM signing zone SES reports for staging.openvaa.org is dkim.amazonses.com, equal to the variable: no second apply before the delegation"
  - "The operator's Identity Center profile is openvaa-admin; operator blocks from 183-17 on export AWS_PROFILE=openvaa-admin"

requirements-completed: []   # INFRA-17 and INFRA-18 are also listed by later plans of this phase (183-18, 183-21); this plan does not close either

duration: "about 11 h 15 min of wall time (2026-10-21T19:46Z to 2026-10-22T07:01Z), almost all of it waiting on the operator"
completed: 2026-10-22
---

# Phase 183 Plan 17: Zone and mail root apply Summary

**No second apply is needed before the delegation.** The signing zone that SES reports for the identity, `dkim.amazonses.com`, equals the variable's value. **Both account asserts exited 0** with the SMTP user in place, so the account clause of INFRA-17 holds as of 2026-10-22.

## What was observed

The operator's reply was stored on 2026-10-22 in attempt `17-1 20261021T194634Z.27ed35730`. It reports:

- **The apply:** the plan announced `Plan: 14 to add, 0 to change, 0 to destroy.`, and the apply reported `Apply complete! Resources: 14 added, 0 changed, 0 destroyed.` The second plan exited 0 under `-detailed-exitcode`, and the state object is AES256-encrypted.
- **The zone:** the zone id is `Z02494181MAM7OCUAIPKC`, with the name servers:
  - `ns-1015.awsdns-62.net`
  - `ns-1109.awsdns-10.org`
  - `ns-1603.awsdns-08.co.uk`
  - `ns-34.awsdns-04.com`
- **The identity:** the three DKIM tokens are equal in Terraform and SES. The SES read gives:
  - `s7_verified=false`
  - `s7_dkim=PENDING`
  - `s7_mailfrom=PENDING`

  These are the states expected before the delegation.
- **The SMTP user:** `openvaa-staging-ses-smtp` has 0 inline policies, and its one attached policy is `openvaa-staging-ses-send`.
- **The secret:** the SMTP password and the SMTP user name were neither printed nor pasted.

The executor read public DNS before the delegation at 2026-10-22T06:56Z:
- **Parent:** the parent's name server `dora.ns.cloudflare.com` answered `NXDOMAIN` with no referral.
- **Public resolver:** `1.1.1.1` returned no NS records for the name.

This is the red control of the delegation check.

## Tasks

| Task | Name | Commit | Notes |
| ---- | ---- | ------ | ----- |
| 1 | The operator applies `staging/dns-mail`, reads the identity and re-runs the asserts | (checkpoint) | Reply in `17-1 20261021T194634Z.27ed35730`. `bound 17-1 OPERATOR_REPLY plan=17 task=1 account=471112560111` exits 0 |
| 2 | Reconcile the DKIM zone, fill the delegation record, record the account evidence | fb5db2fca | Attempt `17-2 20261022T065643Z.27ed35730` holds `Second apply needed: no` |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] The plan's local validate failed after the operator's init**
- **Found during:** Task 2 verify 1.
- **Issue:** the operator's `terraform init` left `.terraform/terraform.tfstate` naming the S3 backend. The plan's `init -backend=false` in the same checkout then tried to reach that backend and failed with `No valid credential sources found`. No credential was used, and nothing changed: the backend type still reads `s3`.
- **Fix:** both verify commands of the plan now run init and validate under a throwaway `TF_DATA_DIR`. Both pass and print "Success! The configuration is valid."
- **Later plans:** plans 183-21, 183-23, 183-24, 183-25 and 183-27 use the same local init. They are logged in `deferred-items.md` to check.
- **Files modified:** 183-17-PLAN.md, deferred-items.md
- **Commit:** 332c3bd55

**2. [Scope] Two more runbook statements moved to Observations**
- The plan asked to move only the DKIM zone statement. The second-plan statement (Step 3, item 8) and the SMTP-user and assert statement (Step 3, item 9) were observed in the same reply, so they moved too. This follows the runbook's own rule.
- The intro of "Not yet observed" no longer says the root is unapplied.

### Provenance notes

- **The profile:** the operator's Identity Center profile is `openvaa-admin`, not the `openvaa` stated at spawn. I had written `openvaa` only into the checkpoint message. No file in `infra/` or the phase directory names a profile, so there was nothing to correct in 183-16's files.
- **Wrapped commands:** the orchestrator wrapped the plan's commands at 60 characters for the operator. The commands were identical, with the long `jq` filters held in `J6` and `J7` and the inventory path in `INV`. The line names are the plan's own.
- **Paste artifact:** a stray line after the step 4 paste was not stored.
- **The apply date:** the apply time was not reported. The evidence gives the window, from the checkpoint at 2026-10-21T19:46Z to the reply at 2026-10-22T06:56Z. The README's dated rows carry 2026-10-22, the date the reply was recorded.
- **The plan's breakdown:** the evidence's per-kind breakdown of the 14 resources comes from the code, not from the plan output. The plan's per-resource list was not pasted.

## Authentication Gates

None for the executor. Task 1 was operator-run by design.

## Known Stubs

None.

## Threat Flags

None. T-183-57 is closed: the zone was compared and is equal. T-183-58 held: only named lines were stored, through the screen.

## Next Phase Readiness

- **Plan 183-18:** reads `Second apply needed: no` from the 17-2 attempt file and skips its step 0. The four NS records in `DELEGATION.md` are ready to enter at Cloudflare.
- **Plan 183-19:** watches DKIM and MAIL FROM go to `SUCCESS` after the delegation.

## Self-Check: PASSED

- FOUND: .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-17-dns-mail-apply.md
- FOUND: infra/envs/staging/dns-mail/DELEGATION.md (4 distinct awsdns name servers, each `not yet entered`)
- FOUND: commit 332c3bd55
- FOUND: commit fb5db2fca
- Task 1 verify, as amended, exits 0. Task 2 verifies 1, 2 and 3 exit 0.
- Prettier is clean on README.md and DELEGATION.md
