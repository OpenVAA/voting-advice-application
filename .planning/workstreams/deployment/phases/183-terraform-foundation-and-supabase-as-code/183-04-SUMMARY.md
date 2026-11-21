---
phase: 183-terraform-foundation-and-supabase-as-code
plan: 04
subsystem: infra
tags: [terraform, aws, route53, ses, dkim, dmarc, iam, modules]

requires:
  - phase: 183-01
    provides: "AWS provider lock hashicorp/aws 6.68.0 under ~> 6.60 (infra/envs/staging/aws/.terraform.lock.hcl), the root shape to repeat, and the plugin cache holding that build"
provides:
  - "infra/modules/dns-zone: aws_route53_zone.this (prevent_destroy); outputs zone_id, domain, name_servers"
  - "infra/modules/mail-ses: aws_sesv2_email_identity.this (RSA_2048_BIT), aws_route53_record.dkim (count = 3, target built from var.dkim_signing_hosted_zone), aws_sesv2_email_identity_mail_from_attributes.this (REJECT_MESSAGE), mail_from_mx, mail_from_spf, dmarc (p=var.dmarc_policy, optional rua), aws_sesv2_account_suppression_attributes.this (count-switched)"
  - "infra/modules/mail-ses SMTP user: aws_iam_user.smtp, aws_iam_access_key.smtp, customer-managed aws_iam_policy.ses_send (ses:SendRawEmail on the identity ARN, StringEquals ses:FromAddress), aws_iam_user_policy_attachment.ses_send, aws_iam_user_policies_exclusive.smtp with policy_names = []"
  - "infra/envs/staging/dns-mail: the third long-lived root, state key hand/staging/dns-mail/terraform.tfstate, outputs name_servers, zone_id, dkim_tokens, sender_address, smtp_endpoint, smtp_username (sensitive), smtp_password (sensitive)"
affects: [183-09, 183-14, 183-17, 183-18, 183-19, 184]

estimate:
  tokens: 62000
  tasks: 3
actuals:
  tokens: 4097     # chars/4 over the eleven committed files (16388 chars, lock file included)
  tasks: 3
  commits: 3

plan_head_before: 5bf7ee91c3bbb4f3ab1e8ef24988df2a9a5af06e
plan_head_after: d965a3e95b00e9b1f82a144e5b1d96379c9bdc06

tech-stack:
  added: []
  patterns:
    - "A record target that AWS says varies is a variable with a documented post-apply check, never a literal"
    - "IAM users get permissions only through customer-managed policies plus an empty users-policies-exclusive resource"
    - "Long-lived roots under the hand/ state prefix hold the secrets; they read no other root's state"

key-files:
  created:
    - infra/modules/dns-zone/main.tf
    - infra/modules/dns-zone/variables.tf
    - infra/modules/dns-zone/outputs.tf
    - infra/modules/mail-ses/main.tf
    - infra/modules/mail-ses/smtp.tf
    - infra/modules/mail-ses/variables.tf
    - infra/modules/mail-ses/outputs.tf
    - infra/envs/staging/dns-mail/main.tf
    - infra/envs/staging/dns-mail/variables.tf
    - infra/envs/staging/dns-mail/terraform.tfvars
    - infra/envs/staging/dns-mail/.terraform.lock.hcl
  modified: []

key-decisions:
  - "Modules validated against hashicorp/aws 6.68.0 by seeding each ignored module lock from the staging aws root and running init -lockfile=readonly (same as 183-02 and 183-03); the dns-mail root's tracked lock is a byte-identical copy"
  - "dmarc_report_address carries a validation (null, or one address with no spaces, commas or semicolons) so the value cannot inject extra DMARC tags; not in the plan"
  - "All mail and DKIM records use a 300 s TTL so a corrected DKIM zone after the first apply propagates quickly"
  - "The DMARC report address is the recommended answer to follow-up 183-R3 (dmarc_agg@vali.email); the operator has not ruled, and plan 183-17 asks before the apply"

patterns-established:
  - "Mail module states each unobserved behaviour (DKIM zone default, send authorisation on the identity ARN, DMARC alignment) as unobserved in a comment or description, never as fact"

requirements-completed: []  # INFRA-17 and INFRA-18 are code-complete here; INFRA-18 closes when 183-17/183-18 apply and delegate the zone, INFRA-17 with the guard (183-09) and the account inventory. SUPA-14 closes in phase 184.

duration: 3min
completed: 2026-10-18
status: complete
---

# Phase 183 Plan 04: DNS zone, SES mail and the dns-mail root Summary

**A Route 53 zone module for the delegated `staging.openvaa.org` (prevent_destroy, name servers out), an SES mail module with 2048-bit Easy DKIM records whose target zone is a variable, a REJECT_MESSAGE custom MAIL FROM with one MX and one SPF record, DMARC `p=quarantine`, and an SMTP user whose only permission is a From-address-bound customer-managed send policy, all joined in a credential-free, validated long-lived root at `hand/staging/dns-mail/terraform.tfstate`.**

## Performance

- **Duration:** about 3 min
- **Started:** 2026-10-18T20:35:55Z
- **Completed:** 2026-10-18T20:38Z
- **Tasks:** 3
- **Files:** 11 created

## Accomplishments

- `dns-zone`: `aws_route53_zone.this` with `name = var.domain`, comment "Managed by Terraform", `prevent_destroy = true`; no DNSSEC resource (neither side signed). Outputs `zone_id`, `domain`, `name_servers`.
- `mail-ses/main.tf`: identity with `next_signing_key_length = "RSA_2048_BIT"`; three DKIM CNAMEs `<token>._domainkey.<domain>` → `<token>.${var.dkim_signing_hosted_zone}`; MAIL FROM `mail.<domain>` with `REJECT_MESSAGE`; exactly one MX (`10 feedback-smtp.<region>.amazonses.com`) and one SPF TXT (`v=spf1 include:amazonses.com ~all`); DMARC TXT at `_dmarc.<domain>`. `terraform console` showed the DMARC expression rendering `v=DMARC1; p=quarantine` with a null address and `v=DMARC1; p=quarantine; rua=mailto:dmarc_agg@vali.email` with one. The only `amazonses.com` strings in `main.tf` are the MX target and the SPF include; the DKIM zone literal appears only as the default in `variables.tf`. The account suppression setting (BOUNCE, COMPLAINT) is count-switched and its comment says it is account-wide in the region.
- `mail-ses/smtp.tf`: user `<prefix>-ses-smtp` and policy `<prefix>-ses-send` under `var.iam_path`; one `Allow` for `ses:SendRawEmail` on the identity ARN with `StringEquals ses:FromAddress = <local>@<domain>`; one `aws_iam_user_policy_attachment`; `aws_iam_user_policies_exclusive` with `policy_names = []`. No inline policy, no group.
- `mail-ses/outputs.tf`: `smtp_username` (access key id) and `smtp_password` (`ses_smtp_password_v4`) both `sensitive = true`; the password's description says it is derived with the provider's region, so the calling root must run in the sending region.
- `envs/staging/dns-mail`: literal S3 backend (`openvaa-tfstate-471112560111`, key `hand/staging/dns-mail/terraform.tfstate`, `eu-north-1`, encrypt, `use_lockfile`), `allowed_account_ids`, default tags with `Root = "dns-mail"`, `module "dns_zone"` and `module "mail_ses"` wired by `zone_id = module.dns_zone.zone_id`; no resource, data source or remote-state read of its own. `terraform.tfvars` holds the account id, region, environment, domain, `dkim_signing_hosted_zone = "dkim.amazonses.com"` and `dmarc_report_address = "dmarc_agg@vali.email"` with the comments the plan asks for; no other address and no secret-named variable.
- Verification: all three directories print "Success! The configuration is valid." with hashicorp/aws 6.68.0 from `init -backend=false -lockfile=readonly`; `terraform fmt -check` exit 0 for each; `cmp` of the root lock with the aws root's lock exit 0; the tfvars secret-name awk exit 0; the password-sensitive awk exit 0; `git check-ignore` on the root's `terraform.tfvars` and `.terraform.lock.hcl` exit 1 (both tracked); no banned resource name, planning path, phase number or decision id in any new file.

## Open until the first apply and phase 184

Three statements are unobserved and are written nowhere as fact:

1. That `dkim.amazonses.com` is the `SigningHostedZone` SES assigns to this identity in `eu-north-1` (checked after the first apply; a difference is a one-line tfvars change and a re-apply).
2. That SES authorises an SMTP send against the identity ARN with the `ses:FromAddress` condition (fallback: same statement on resource `*`, condition kept; plan 183-19 lists it as not yet observed).
3. That mail from the identity passes DMARC alignment (phase 184 reads a received header).

## Task Commits

1. **Task 1: the hosted zone module** - `3c524a1a3` (feat)
2. **Task 2: the mail module (identity, mail DNS records, SMTP user)** - `2b2bcc93e` (feat)
3. **Task 3: the `staging/dns-mail` root** - `d965a3e95` (feat)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] A bare module init would resolve hashicorp/aws 6.69.1, not the locked 6.68.0**
- **Found during:** Task 1 (known from 183-02 and 183-03)
- **Fix:** Seeded each module's ignored `.terraform.lock.hcl` from `infra/envs/staging/aws/.terraform.lock.hcl` and ran `init -backend=false -input=false -lockfile=readonly`, then the plan's `validate` and `fmt -check`. The module locks and `.terraform/` are ignored (`!!`); nothing extra is tracked.
- **Commit:** n/a

**2. [Rule 2 - Missing validation] `dmarc_report_address` accepted any string**
- **Found during:** Task 2
- **Issue:** The value is interpolated into the DMARC TXT record; a value with `;` would publish extra DMARC tags.
- **Fix:** Validation `var.dmarc_report_address == null || can(regex("^[^@;,\\s]+@[^@;,\\s]+$", ...))`; `terraform console` showed `true` for null and `dmarc_agg@vali.email`, `false` for `x@y; p=none`.
- **Files modified:** infra/modules/mail-ses/variables.tf
- **Commit:** 2b2bcc93e

**3. [Rule 3 - Tooling] The acceptance check `git check-ignore -q a b; test $? -eq 1` exits 128 on this Git**
- **Found during:** Task 3
- **Issue:** `--quiet is only valid with a single pathname`.
- **Fix:** Ran `git check-ignore` without `-q` on both paths (exit 1) and `-q` on each path singly (exit 1 each). Same check, same meaning.
- **Commit:** n/a

## Known Stubs

None. `dmarc_report_address` is the recommended, not yet ruled, answer to follow-up 183-R3; plan 183-17 confirms it before the apply.

## Threat Flags

None. Every surface is in the plan's register (T-183-15 to T-183-18, T-183-SC) and each mitigation is present as a declared argument.

## Self-Check: PASSED

- FOUND: all eleven files listed under key-files
- FOUND commits: 3c524a1a3, 2b2bcc93e, d965a3e95 (ancestors of HEAD)
- `commits: 3` measured with `git rev-list --count 5bf7ee91c..HEAD` before this SUMMARY's commit
