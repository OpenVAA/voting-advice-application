---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 18
subsystem: infra
tags: [dns, route53, cloudflare, delegation, infra-18, operator-checkpoint]
status: complete

requires:
  - phase: 183-17
    provides: "the hosted zone Z02494181MAM7OCUAIPKC with its four name servers, the six mail records, and `Second apply needed: no`"
  - phase: 183-01
    provides: "tools/attempt.sh (attempt files, reply screen, bound checks)"
provides:
  - "staging.openvaa.org delegated from the Cloudflare zone openvaa.org to Route 53: four NS records, entered 2026-10-22T07:25Z"
  - "DELEGATION.md completed: entry times, the empty dashboard search, no DS, first public answer, check and undo commands"
  - "evidence/183-18-dns-delegation.md: referral, public resolver NS/SOA, DS/DNSKEY absence, six mail-record answers"
affects: [183-19, phase-183-verification]

estimate:
  tokens: 36000
  tasks: 2
actuals:
  tokens: 3500     # chars/4 over the realized diff (14030 chars)
  tasks: 2
  commits: 1       # MEASURED: git rev-list --count plan_head_before..HEAD at SUMMARY write

plan_head_before: 9a595c791cfedb58271d12340783edd8077650c1
plan_head_after: 7e4e6dcaabd22b59fe6cd1f49ade1e25aa7038db

tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - .planning/workstreams/deployment/phases/183-terraform-foundation-and-supabase-as-code/evidence/183-18-dns-delegation.md
  modified:
    - infra/envs/staging/dns-mail/DELEGATION.md

key-decisions:
  - "The four answer_ns_ values come from the operator's pasted referral query, not from the dashboard fields; recorded as such"

requirements-completed: []   # INFRA-18 is also listed by later plans (183-19, 183-21, 183-28); this plan delivers its delegation half and leaves the mark to them

duration: "about 1 h (2026-10-22T07:04Z checkpoint to 08:05Z), most of it waiting on the operator"
completed: 2026-10-22
---

# Phase 183 Plan 18: Delegation of staging.openvaa.org Summary

**`staging.openvaa.org` is delegated from Cloudflare to the Route 53 zone `Z02494181MAM7OCUAIPKC`.** Both parent name servers return a referral to exactly the four name servers of `DELEGATION.md`. `1.1.1.1` answers NS and SOA from Route 53, and all six mail records resolve in public DNS.

## Times

- **Records saved at Cloudflare:** 2026-10-22T07:25Z, as the operator reported.
- **Referral check by the executor:** 2026-10-22T08:03:11Z, against both `dora` and `ganz.ns.cloudflare.com`. The status was `NOERROR`, the flags `qr` only (no `aa`), with 4 NS records in AUTHORITY at TTL 300. The operator's own referral query was at 07:25:41Z.
- **First public answer:** 2026-10-22T08:03:11Z (`1.1.1.1`, NS and SOA). This was the first public query anyone made after the entry. It answered at once, so no poll was run. An earlier answer was possible but was not observed. Re-checked at 08:04:20Z with the same result.

## Tasks

| Task | Name | Commit | Notes |
| ---- | ---- | ------ | ----- |
| 1 | The operator enters the four NS records at Cloudflare | (checkpoint) | Reply in attempt `18-1 20261022T070416Z.9a595c791`. `bound 18-1 OPERATOR_REPLY plan=18 task=1 zone=Z02494181MAM7OCUAIPKC` exits 0. Step 0 was skipped (`Second apply needed: no`). Task 1 verify exits 0 |
| 2 | Verify from outside, write the delegation record | 7e4e6dcaa | Attempt `18-2 20261022T080311Z.9a595c791`. Verifies 1, 2 and 3 exit 0 |

## Observed

- **Referral:** the referral's four names equal the table's four, compared as sets. None is missing and none is extra.
- **SOA:** `ns-1015.awsdns-62.net. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400`.
- **Signing:** no `DS` record for `staging.openvaa.org` and no `DNSKEY` record for `openvaa.org` (08:03:12Z). No DS record was added.
- **DKIM:** the three CNAMEs point to `<token>.dkim.amazonses.com` with 183-17's tokens.
- **MAIL FROM:** the MX is `10 feedback-smtp.eu-north-1.amazonses.com.` and the SPF record is `v=spf1 include:amazonses.com ~all`.
- **DMARC:** `p=quarantine` with the published report address.
- **Dashboard:** the operator's search found no record at or under `staging` (`answer_existing_staging_record=none`).

## Deviations from Plan

### Provenance notes (not code deviations)

- **The four `answer_ns_` values** were not typed from the dashboard. They were taken from the operator's own pasted `dig +norecurse NS staging.openvaa.org @dora.ns.cloudflare.com` output, which listed exactly the table's four with trailing dots. They show what the parent serves, not the dashboard's fields. This is recorded on `note:` lines of the 18-1 attempt file and in the evidence.
- **`answer_existing_staging_record=none`** was confirmed by the operator in a separate message.
- **An extra `dig +trace`** (one of RESEARCH Q6's four commands, not one of the plan's steps) timed out from this host with exit 9. It is recorded as showing nothing about the zone.
- **An undo section** was added to `DELEGATION.md`. The file's intro states that its purpose is to let the delegation be checked and undone.

### Plan command review

- Step 0 of Task 1, had it applied, set no `AWS_PROFILE=openvaa-admin` and ran no account check. It was moot, because 183-17 recorded `no`.
- Verify 2's `awk` also catches the prose sentence "They are not yet entered at the parent zone.". That sentence was rewritten.

## Authentication Gates

None for the executor. Task 1 was done by the operator, by design.

## Known Stubs

None.

## Threat Flags

None.
- **T-183-44** (shadowed records) is mitigated: the dashboard search found none.
- **T-183-45** (delegation to a name server this project does not control) is mitigated: the referral equals the table as sets.

## Next Phase Readiness

- **Plan 183-19:** the six mail records resolve publicly, so SES can now find DKIM and MAIL FROM. 183-19 reads the identity until it shows `SUCCESS`, and edits the runbook `README.md`, which this plan did not touch.

## Self-Check: PASSED

- FOUND: evidence/183-18-dns-delegation.md
- FOUND: infra/envs/staging/dns-mail/DELEGATION.md
- FOUND: 183-18-SUMMARY.md
- FOUND: commit 7e4e6dcaa
- Task 1 verify, Task 2 verifies 1, 2 and 3: all exit 0. Prettier is clean on DELEGATION.md
