---
created: 2026-11-21T07:45:01.000Z
title: Unobserved statements about the deployed stack (189)
area: deployment / operations
severity: minor
source: Phase 189 (C-01)
owner: the operator of any hosted deployment
files:
  - infra/bootstrap/README.md
  - infra/envs/staging/aws/README.md
  - infra/envs/staging/dns-mail/README.md
  - apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md
---

## Problem

Phase 189 swept the staging runbooks of every statement about a deployed system that had not been seen (C-01). A statement that a read-only check or an existing record settled became a dated Observations row. The ones below were settled by nothing on record, so they left the runbooks rather than stand there as if they were facts; the dispositions are in `.planning/workstreams/deployment/phases/189-documentation-and-closure/evidence/189-15-c01-bootstrap-aws.md` and `189-16-c01-mail-supabase-modules.md` beside it. Each stays open here with the check that would settle it. Nothing in the runbooks or the guide relies on any of them.

## Statements

- **The budget's actual alert reaches the operator's mailbox, and how long it takes after the spend passes the threshold.** Was in `infra/bootstrap/README.md`, § "Not yet observed" (checked by Step 7, item 3). The 2026-10-23 row records the alert triggered in the AWS Budgets console and no mail within two days, the address not having been confirmed. INFRA-15 closed on the operator's ruling accept-console-alert (2026-10-23), so the mail is not required. Check: with the subscription address confirmed, set a test amount below the computed spend (Step 7, items 1 to 3) and record when the mail arrives against the time the console shows the alert triggered.
- **A forecast alert fires.** Was in `infra/bootstrap/README.md`, § "Not yet observed" (checked by a later stage). AWS documents that a forecast alert needs about five weeks of usage data. Check: on an account with more than five weeks of usage, read the budget's forecast alert state in the AWS Budgets console (or `aws budgets describe-notifications-for-budget` and the console's history) once the forecast passes 100 percent of the limit.
- **An account holds one OIDC provider per URL, so a second create for GitHub's URL fails.** Was in `infra/bootstrap/README.md`, § "Not yet observed" (checked by Step 1, item 4). Staging's account had none (2026-10-21 row), so no second create was tried. Check: cite AWS's IAM documentation for the one-provider-per-URL rule, or, in a throwaway account, create the provider for `https://token.actions.githubusercontent.com` twice and record the second call's error (`EntityAlreadyExists` is expected); `aws iam list-open-id-connect-providers` shows how many exist.
- **For an SES account still in the sandbox: the production-access request is accepted as filed, and how Support answers it.** Was in `infra/envs/staging/dns-mail/README.md`, § "Not yet observed" (checked by Step 8, item 2, and the mail Support sends afterwards). Not applicable to staging: the 2026-10-22 row (Step 8, item 2) records production access already enabled in `eu-north-1`, so no request was filed. A fork whose account is in the sandbox meets it first. Check: on such an account, file the request of Step 8, item 2, record `answer_request_filed_utc=`, then the time and content of Support's answer and `s2_production=` read again by the `get-account` of the same item.
- **For an SES account still in the sandbox: `create-email-identity` for a single address sends a verification mail with a link to that address.** Was in `infra/envs/staging/dns-mail/README.md`, § "Not yet observed" (checked by Step 9, item 3). Not applicable to staging, for the same reason: no mailbox was verified for the sandbox. Check: on a sandbox account, run Step 9, item 3 for your own address and record `s3_mailbox_exit=`, whether the mail with the link arrives, and the identity's status from `aws sesv2 get-email-identity` after the link is followed.
- **The password sign-in's timing difference between an unknown address, a wrong password and an account with no password shows over a network.** Was on `developers-guide/backend/authentication`, § Known residuals, the bullet on the password sign-in's timings, which now states the figures as a local measurement only (loopback interface of one host, nine sign-ins a case). Check: against a hosted project, from a client on another network and with test accounts only, time nine interleaved `POST /auth/v1/token?grant_type=password` sign-ins a case with the anon key, for an address with no account, an account with a wrong password and an account with no password, and record the least, median and greatest time of each case and whether the ranges overlap.
