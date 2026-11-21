# 189-16 evidence: the unobserved statements of the DNS-and-mail and Supabase runbooks, the module comments and the authentication page (C-01)

Recorded 2026-11-21 (UTC) by the plan executor of plan 189-16. Every disposition below is read from a tracked record: the runbooks' own dated Observations rows and the evidence of plan 189-05 (`189-05-staging-reads.md`, read 2026-11-20T13:34Z). No AWS, Supabase, DNS or GitHub call was made. Each statement is matched by its text, as numbered in `189-RESEARCH.md` § C-01. A `todo` disposition is carried, with its check, into `.planning/todos/pending/2026-11-20-189-unobserved-statements-about-the-deployed-stack.md`.

## `infra/envs/staging/dns-mail/README.md`

```
C01_S14=todo For an account still in the sandbox, the production-access request is accepted as filed, and how Support answers it. Not applicable to staging: the 2026-10-22 row (Step 8, item 2) records production access already enabled in eu-north-1, so no request was filed. Removed with the section; carried with its check.
C01_S15=todo For an account still in the sandbox, create-email-identity for a single address sends a verification mail with a link. Not applicable to staging for the same reason (no mailbox verified for the sandbox). Removed with the section; carried with its check.
C01_S16=row 2026-11-11 SES accepts an SMTP send under the scoped send policy. Settled by the Supabase runbook's 2026-11-11 row on the sign-in mail from the served account-access, sent through SES on port 2587, which arrived. Row added in the DNS-and-mail runbook, dated 2026-11-11, pointing to the Supabase runbook's Observations, after the table's last 2026-10-22 row so the table stays in date order.
C01_S17=row 2026-11-11 A received mail passes DKIM, SPF and DMARC, aligned with the From domain. Settled by the Supabase runbook's 2026-11-11 row on the mail's Authentication-Results (dkim=pass for staging.openvaa.org, aligned, and amazonses.com; spf=pass for mail.staging.openvaa.org; dmarc=pass under p=QUARANTINE). Row added, dated 2026-11-11, pointing to it.
C01_S18=row 2026-11-20 The staging name's DMARC record takes the place of the organisation's policy for mail from that name. Settled by plan 189-05's read (S1_DMARC_ORG_POLICY=none, S1_DMARC_STAGING_POLICY=quarantine, S1_DMARC_DIFFERS=yes, already a 2026-11-20 row) together with the 2026-11-11 mail passing DMARC under p=QUARANTINE: the policy applied is the zone's own. Row added, dated 2026-11-20, after the existing 2026-11-20 row.
C01_S19=rewritten The Step 6 sentence that pointed the delegation checks at the unobserved section now states what each of the four commands shows, citing the 2026-10-22 Step 6 row.
C01_S29=rewritten The overview's sentence that the first SES mail comes in a later stage now says the hosted account-access sends the mail through SES, its first mail on 2026-11-11 recorded in the Supabase runbook's Observations (linked).
```

The section "Not yet observed" is deleted. Back-links: 8 `← guide:` lines under Step 1, Step 5, Step 7, Step 8, Step 9 and Observations, one per citing section of the deployment and operations pages.

## `infra/envs/staging/supabase/README.md`

```
C01_S20=deleted The empty section "Not yet observed" is deleted.
C01_S28=rewritten The sentence of § Settings and their guard that the root's terraform.tfvars gains its smtp object in a later stage now says Step 18 applies the SMTP settings when a root's terraform.tfvars sets its smtp object, as the staging root's does (infra/envs/staging/supabase/terraform.tfvars sets smtp; 2026-11-11 rows on the plan with smtp set and the apply).
```

Back-links: 25 `← guide:` lines under Steps 8, 9 and 15 to 24 and Observations, one per citing section of the deployment, hosted-settings and operations pages.

## The module comments (`infra/modules/`)

Each comment now states the code and what holds, in the present tense, with no date, run id or planning reference. Only comment lines changed (`git diff -U0 infra/modules` holds no changed line whose first non-blank character is not `#`).

```
C01_S21=rewritten infra/modules/supabase/main.tf, the comment above supabase_settings.smtp_secret: each of the two settings resources writes only its own keys, and the first SMTP enablement is accepted with the user name and password from the second. Settled by the Supabase runbook's 2026-11-09/10 rows (two settings resources side by side, each keeping its own keys, the next plan "No changes"; the first SMTP enablement accepted with the credentials from the second resource) and its 2026-11-11 rows (the persistent root's plan with smtp set creating smtp_secret[0]; the apply whole on the first try, the project serving the SMTP host, port and sender with an SMTP user name set).
C01_S22=rewritten infra/modules/mail-ses/main.tf, the comment above aws_route53_record.dkim: the default is the zone SES assigns to this identity. Settled by the DNS-and-mail runbook's 2026-10-22 row (Step 2, item 7: SigningHostedZone reads dkim.amazonses.com, the default).
C01_S23=rewritten infra/modules/mail-ses/main.tf, the comment above aws_route53_record.dmarc: mail from this identity passes DMARC, aligned with the From domain. Settled by the Supabase runbook's 2026-11-11 row on the mail's Authentication-Results (dkim=pass aligned with staging.openvaa.org, spf=pass, dmarc=pass), and the DNS-and-mail runbook's new 2026-11-11 row.
C01_S24=rewritten infra/modules/mail-ses/smtp.tf, the comment above data.aws_iam_policy_document.ses_send: SES authorises an SMTP send against the identity's ARN under this condition. Settled by the Supabase runbook's 2026-11-11 row (a sign-in mail sent through SES by the SMTP user arrived), with the DNS-and-mail runbook's 2026-10-22 row (Step 3, item 9: the SMTP user's one attached policy is this send policy). The fallback clause for a refused first send is dropped, since the send was accepted.
```

## `apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md`, § Known residuals

The bullets' headings and every anchor are kept; only the sentences named below changed.

```
C01_S25=moved-to-pre-launch-todo The per-server sign-in budget stays a pre-launch risk; the sentences saying which address the hosted auth service counts is not measured are replaced by the check to run before a hosted project goes live (exhaust the budget from one client through one server, sign in from another network, a 429 over_request_rate_limit means shared; code and email sign-in checked apart) and the remedy. The check itself is held by plan 189-17's todo, .planning/todos/pending/2026-11-20-189-pre-launch-auth-checks-on-the-production-project.md § Check: the shared per-address sign-in budget.
C01_S26=todo The timing difference is stated as a local measurement only; the hosted half (whether the difference shows over a network) is carried into the C-01 todo with its check.
C01_S27=row 2026-11-20 S1_POSTGRES_UPDATE_AUTH_USERS=t (189-05-staging-reads.md, read 2026-11-20T13:34Z, also a 2026-11-20 row in the Supabase runbook): the page now states that postgres may update auth.users on the local stack and on a hosted project, with the staging read and its date.
```
