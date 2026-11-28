---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 19
subsystem: infra
tags: [aws, ses, dkim, spf, dmarc, infra-18, operator-checkpoint]
status: complete

requires:
  - phase: 183-17
    provides: "the SES identity staging.openvaa.org, its three DKIM tokens, the signing zone dkim.amazonses.com"
  - phase: 183-18
    provides: "the delegation of staging.openvaa.org to Route 53, resolving publicly since 2026-10-22T08:03Z"
  - phase: 183-01
    provides: "tools/attempt.sh (attempt files, reply screen, bound checks)"
provides:
  - "SES identity staging.openvaa.org read as verified for sending, DKIM SUCCESS, MAIL FROM SUCCESS (2026-10-22)"
  - "six mail records read from 1.1.1.1 on 2026-10-22, DKIM targets in dkim.amazonses.com"
  - "the account read: production access already enabled in eu-north-1 (max24h 50000); no request filed, no sandbox mailbox"
  - "evidence/183-19-ses-identity.md; runbook Steps 7 to 9 with the account check and the pre-read of the account"
affects: [183-27, 183-28, phase-184, phase-183-verification]

estimate:
  tokens: 34000
  tasks: 2
actuals:
  tokens: 8110     # chars/4 over the realized diff (32439 chars)
  tasks: 2
  commits: 1       # MEASURED: git rev-list --count plan_head_before..HEAD at SUMMARY write

plan_head_before: 2c9d25534166150b4d63a7cee53a39a5e173d933
plan_head_after: 2a826bd825ea3e439b77d34ed59d333f3334a330

tech-stack:
  added: []
  patterns:
    - "Read the account before any state-changing SES call; a per-region grant can already exist"

key-files:
  created:
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-19-ses-identity.md
  modified:
    - infra/envs/staging/dns-mail/README.md
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/183-19-PLAN.md
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/deferred-items.md

key-decisions:
  - "SES production access in eu-north-1 was already granted (read before filing); by operator ruling no production-access request was filed and no sandbox mailbox was verified"
  - "The scoped SMTP send policy is still not observed; phase 184's fallback if SES refuses the first send is the same statement on resource * with the From-address condition kept"

requirements-completed: []   # INFRA-18 is also listed by 183-21 and 183-28; this plan observes criterion 4's second sentence and leaves the mark to them

duration: "about 30 min (2026-10-22T08:07Z to 08:37Z), most of it waiting on the operator"
completed: 2026-10-22
---

# Phase 183 Plan 19: SES identity verified and the mail records published Summary

**The SES domain identity `staging.openvaa.org` is verified for sending**, with DKIM `SUCCESS` and the MAIL FROM domain `SUCCESS`, as of 2026-10-22. All six of its mail records resolve in public DNS. The account already had SES production access in `eu-north-1`, so by the operator's ruling no request was filed and no sandbox mailbox was verified.

## What was observed

The operator's reply is in attempt `19-1 20261022T080840Z.2c9d25534`, stored at 08:33:02Z. `bound 19-1 OPERATOR_REPLY plan=19 task=1` exits 0.

- **Account:** `s0_account=471112560111`.
- **Identity (step 1):** `s1_identity_exit=0`. `s1_verified=true`, `s1_dkim=SUCCESS` and `s1_mailfrom=SUCCESS`, each on its own line.
- **Account read before anything was filed (`s2a_`):**
  - `s2a_account_exit=0`
  - `s2a_production=true`
  - `s2a_sending=true`
  - `s2a_max24h=50000.0`

  This matches the 183-14 inventory of 2026-10-21.
- **Steps 2 and 3:** not run, by the operator's ruling (`answer_skip_steps_2_3=yes`).
- **Cleanup:** `s4_logs_removed=yes`. No address was given to any command or file.

The executor's own `dig @1.1.1.1` reads are in attempt `19-2 20261022T083313Z.2c9d25534`, all at 2026-10-22T08:33:13Z:
- **DKIM:** the three CNAMEs are `<token>.dkim.amazonses.com.`, which ends in the signing zone 183-17 recorded.
- **MAIL FROM:** the MX is `10 feedback-smtp.eu-north-1.amazonses.com.` and the SPF record is `v=spf1 include:amazonses.com ~all`.
- **DMARC:** `v=DMARC1; p=quarantine; rua=mailto:dmarc_agg@vali.email`.

## Tasks

| Task | Name | Commit | Notes |
| ---- | ---- | ------ | ----- |
| 1 | The operator confirms the identity is verified (and, if the account is in the sandbox, files the request and verifies a mailbox) | (checkpoint) | Reply in `19-1 20261022T080840Z.2c9d25534`. Task 1 verify (the dig checks) exits 0 |
| 2 | Read the published mail records and record the identity's state | 2a826bd82 | Attempt `19-2 20261022T083313Z.2c9d25534`. Verifies 1, 2 (as amended) and 3 exit 0 |

## For phase 184

- **The scoped send policy has not been seen working.** No SMTP send was made, and the SMTP outputs of `staging/dns-mail` were not read. That policy allows `ses:SendRawEmail` on this identity's ARN, with the `ses:FromAddress` condition for `noreply@staging.openvaa.org`.
- **The fallback.** If SES refuses the first send from the hosted function, use the same statement on resource `*`, with the From-address condition kept.
- **Recipients.** The account is outside the sandbox in `eu-north-1`, so that first mail needs no verified recipient.
- **Still open:** DKIM, SPF and DMARC passing on a received mail, and the subdomain DMARC replacing the organisation policy. Both stay "not yet observed" in the runbook.

## Deviations from Plan

### Operator ruling (not a defect in the plan's commands)

**1. Steps 2 and 3 skipped because production access was already granted**
- **Found during:** Task 1. The orchestrator added a read-only account read under `s2a_`, run before step 2.
- **Ruling:** `skip23=yes`, stored as `answer_skip_steps_2_3=yes` with a note, because the screen accepts only prefixed names. The reasons:
  - production access is per account and region, and was already granted;
  - a new request would overwrite the account's contact details;
  - the mailbox identity is needed only in the sandbox.
- **Amended in `183-19-PLAN.md`:**
  - **Must-haves:** the two truths on the request and the mailbox.
  - **Task 1:** a dated amendment paragraph with the `s0_` and `s2a_` commands, and the acceptance criteria.
  - **Task 2:** verify 2 now accepts the `s2a_` lines with `answer_skip_steps_2_3=yes` in place of the `s2_`, `s3_` and request-date lines. The original branch is kept for a sandbox account. Its fails_when and acceptance criteria changed to match.
  - **The success criterion** on the request.
- **Runbook:** Step 7 gains the account check (item 0). Step 8 gains the pre-read of the account (item 2), and Step 9 is now conditional on the sandbox. The sandbox path stays documented. Every operator command in the plan's instructions appears in the runbook word for word, which is plan 183-28's check.
- **Commit:** 2a826bd82

**2. Account check added (flag 1 of the checkpoint, accepted)**
- The operator exported the profile and ran `s0_account` first. The line is now in the plan's amendment paragraph and in the runbook. The runbook names no profile.

### Scope

**3. Two more runbook statements moved to Observations**
- The Cloudflare-dashboard statement (Step 5) and the referral statement (Step 6) were observed by 183-18 on 2026-10-22, but were still listed as not yet observed. They moved with the identity statement, following the runbook's own rule, as 183-17 did.
- The request row and the mailbox row stay under "Not yet observed", reworded as "For an account still in the sandbox". They were not observed here.

### Recording notes

- **dig statuses:** the `exit:` lines of the first dig recording are empty, because the shell was zsh and `PIPESTATUS` is unset there. The statuses were read again 8 s later and were all 0. A note in the attempt file says so.
- **Exact times:** the minute of each operator read was not reported. The evidence gives the window from 08:08Z to 08:33:02Z.

## Deferred Issues

Logged in `deferred-items.md`:
- **Milestone wording:** ROADMAP.md and REQUIREMENTS.md say production access is "requested". The precondition is met by an existing grant instead.
- **Mailbox assumptions:** no later plan assumes a verified operator mailbox. 183-20's mailbox is the budget mail, which SES does not send.

## Authentication Gates

None for the executor. Task 1 was operator-run by design.

## Known Stubs

None.

## Threat Flags

None.
- **T-183-47:** held. No address is in any file, and the address scan of the evidence passes.
- **T-183-60:** held. No test send was made, and the SMTP outputs were not read.

## Self-Check: PASSED

- FOUND: evidence/183-19-ses-identity.md (names `Attempt: 19-1 20261022T080840Z.2c9d25534` and `Attempt: 19-2 20261022T083313Z.2c9d25534`)
- FOUND: infra/envs/staging/dns-mail/README.md (Prettier clean; the SMTP row is still under "Not yet observed")
- FOUND: commit 2a826bd82
- Task 1 verify and Task 2 verifies 1, 2 (as amended) and 3 all exit 0
