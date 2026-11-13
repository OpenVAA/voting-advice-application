---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 08
subsystem: infra
tags: [terraform, aws, example, dns-mail, state-key]
status: complete

requires:
  - phase: 183-01
    provides: "infra/envs/staging/aws (literal S3 backend shape, provider block, variables) and its hashicorp/aws 6.68.0 lock file"
  - phase: 183-04
    provides: "infra/envs/staging/dns-mail (dns-zone and mail-ses module calls, variables, outputs)"
provides:
  - "infra/envs/example/dns-mail: forker template, bucket REPLACE-ME-tfstate, key hand/example/dns-mail/terraform.tfstate, same wiring, variables and outputs as staging/dns-mail"
  - "infra/envs/example/aws: forker template, bucket REPLACE-ME-tfstate, key pipeline/example/aws/terraform.tfstate, no resource yet"
  - "Stand-in tfvars for both roots: aws_account_id 000000000000 (refused by allowed_account_ids), environment example, domain vaa.example.org, dmarc_report_address null"
affects: [187]

estimate:
  tokens: 36000
  tasks: 2
actuals:
  tokens: 2688     # chars/4 over the eight committed files (10750 chars, lock files included)
  tasks: 2
  commits: 2

plan_head_before: c2c8b3cc6ae0f498d240926204d4bae065a2a874
plan_head_after: b0f5d0e2f0fce2756bf6d691553190cd0bb38f83

tech-stack:
  added: []
  patterns:
    - "Example roots are generated from their staging twin: a template header comment, then the staging main.tf with only bucket and key swapped; variables.tf and the lock file are byte copies"

key-files:
  created:
    - infra/envs/example/dns-mail/main.tf
    - infra/envs/example/dns-mail/variables.tf
    - infra/envs/example/dns-mail/terraform.tfvars
    - infra/envs/example/dns-mail/.terraform.lock.hcl
    - infra/envs/example/aws/main.tf
    - infra/envs/example/aws/variables.tf
    - infra/envs/example/aws/terraform.tfvars
    - infra/envs/example/aws/.terraform.lock.hcl
  modified: []

key-decisions:
  - "The example dns-mail main.tf keeps staging's backend comment verbatim (including the note that the state holds the SMTP secret in clear text), so the two files differ only in bucket, key and the header comment"
  - "The example dns-mail tfvars assigns manage_account_suppression = true explicitly, although it is the variable default, so a forker sees the switch"

patterns-established: []

requirements-completed: []  # INFRA-18 is listed on the plan but closes with the staging zone apply; INFRA-19 closes in phase 187

duration: 3min
completed: 2026-10-18
---

# Phase 183 Plan 08: Example AWS roots Summary

**This plan adds the `example` environment's two AWS roots, `infra/envs/example/dns-mail` and `infra/envs/example/aws`. Each is its staging twin with a template header, a `REPLACE-ME-tfstate` bucket and its own state key, and stand-in values. The stand-in account id `000000000000` means `allowed_account_ids` refuses every real shell, so neither root can be applied unedited. Both validate with no credentials.**

## Performance

- **Duration:** about 3 min
- **Started:** 2026-10-18T20:51Z
- **Completed:** 2026-10-18T20:54Z
- **Tasks:** 2
- **Files created:** 8

## Accomplishments

- `infra/envs/example/dns-mail` has the same `terraform` block, provider block, `dns_zone` and `mail_ses` module calls and seven outputs as `staging/dns-mail`. Its backend is `REPLACE-ME-tfstate` / `hand/example/dns-mail/terraform.tfstate`. Its tfvars has comments on the account id (the provider refuses any other account), the DKIM zone (varies by Region and identity, confirmed after the first apply) and DMARC (a mailbox on another domain must authorise the sending domain). It contains no e-mail address.
- `infra/envs/example/aws` mirrors `staging/aws`. Its backend is `REPLACE-ME-tfstate` / `pipeline/example/aws/terraform.tfstate`, and like its twin it declares no resource.
- All five AWS roots (`bootstrap`, `staging/aws`, `staging/dns-mail`, `example/aws`, `example/dns-mail`) now have byte-identical lock files (hashicorp/aws 6.68.0).

## Task Commits

1. **Task 1: The `example/dns-mail` root**: `48c89aa0c` (feat)
2. **Task 2: The `example/aws` root**: `b0f5d0e2f` (feat)

## Verification

| Check | Result |
|---|---|
| example/dns-mail: `init -backend=false -lockfile=readonly`, `validate`, `fmt -check -recursive` | exit 0 each, "Success! The configuration is valid." |
| example/aws: same three | exit 0 each, "Success! The configuration is valid." |
| `cmp` staging/aws lock vs each example lock | exit 0 (identical) |
| `diff` staging vs example `main.tf` with bucket, key and comment lines stripped (both roots) | exit 0 (no difference) |
| `cmp` staging vs example `variables.tf` (both roots) | exit 0 (identical) |
| `^resource ` lines in example/aws/main.tf | 0 |
| e-mail address in example/dns-mail tfvars | none (`@` not present) |
| No planning path, phase number, or decision or requirement id in any new file | grep exit 1 (none) |
| `git check-ignore -q`, run per path on the eight files | exit 1 on all eight (tracked) |
| `git status --porcelain` on the two directories before each commit | only this plan's files |
| Lock files of the five AWS roots | all identical to staging/aws |
| example/dns-mail tfvars type-checked in `terraform console` (scratch copy, local backend) | values load with the declared types; `module.mail_ses.sender_address` evaluates to `noreply@vaa.example.org` |

## Decisions Made

See `key-decisions` in the frontmatter.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Verification gap] `validate` does not read tfvars, so I type-checked the dns-mail tfvars separately**
- **Found during:** Task 1
- **Issue:** `terraform validate` ignores `terraform.tfvars`, so a type error in the stand-in values (for example the `null` DMARC address) would not have been caught.
- **Fix:** As in 183-07, I copied the root and the two modules to the scratchpad, swapped the S3 backend for a local one, ran `init -lockfile=readonly`, and evaluated each `var.*` and `module.mail_ses` in `terraform console`. Every run exited 0. No repository file changed.
- **Commit:** n/a

The secret-name awk defect noted for earlier plans did not apply: this plan's verify blocks have no such check, and neither tfvars file contains a matching name.

---

**Total deviations:** 1 (one added check)
**Impact on plan:** none. Both roots match the plan.

## Issues Encountered

None.

## User Setup Required

None. Nothing applies these roots.

## Next Phase Readiness

- CI (phase 187) can validate both example roots with `init -backend=false -lockfile=readonly` and no credentials.
- When the frontend stack phase adds resources to `staging/aws`, it adds the same wiring to `example/aws`.

## Threat Flags

None. T-183-55 is mitigated: both tfvars set `aws_account_id = "000000000000"`, and both backends name a bucket that does not exist. T-183-SC is mitigated: no provider was added, both lock files are byte copies of the 6.68.0 lock, and both inits ran with `-lockfile=readonly`.

## Self-Check: PASSED

- FOUND: all eight files listed under key-files
- FOUND commits: 48c89aa0c, b0f5d0e2f (ancestors of HEAD)
- `commits: 2` measured with `git rev-list --count c2c8b3cc6..HEAD` before this SUMMARY's commit
