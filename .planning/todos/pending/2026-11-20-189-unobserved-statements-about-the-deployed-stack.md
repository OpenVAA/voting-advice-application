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
---

## Problem

Phase 189 swept the staging runbooks of every statement about a deployed system that had not been seen (C-01). A statement that a read-only check or an existing record settled became a dated Observations row. The ones below were settled by nothing on record, so they left the runbooks rather than stand there as if they were facts; the dispositions are in `.planning/workstreams/deployment/phases/189-documentation-and-closure/evidence/189-15-c01-bootstrap-aws.md`. Each stays open here with the check that would settle it. Nothing in the runbooks or the guide relies on any of them.

## Statements

- **The budget's actual alert reaches the operator's mailbox, and how long it takes after the spend passes the threshold.** Was in `infra/bootstrap/README.md`, § "Not yet observed" (checked by Step 7, item 3). The 2026-10-23 row records the alert triggered in the AWS Budgets console and no mail within two days, the address not having been confirmed. INFRA-15 closed on the operator's ruling accept-console-alert (2026-10-23), so the mail is not required. Check: with the subscription address confirmed, set a test amount below the computed spend (Step 7, items 1 to 3) and record when the mail arrives against the time the console shows the alert triggered.
- **A forecast alert fires.** Was in `infra/bootstrap/README.md`, § "Not yet observed" (checked by a later stage). AWS documents that a forecast alert needs about five weeks of usage data. Check: on an account with more than five weeks of usage, read the budget's forecast alert state in the AWS Budgets console (or `aws budgets describe-notifications-for-budget` and the console's history) once the forecast passes 100 percent of the limit.
- **An account holds one OIDC provider per URL, so a second create for GitHub's URL fails.** Was in `infra/bootstrap/README.md`, § "Not yet observed" (checked by Step 1, item 4). Staging's account had none (2026-10-21 row), so no second create was tried. Check: cite AWS's IAM documentation for the one-provider-per-URL rule, or, in a throwaway account, create the provider for `https://token.actions.githubusercontent.com` twice and record the second call's error (`EntityAlreadyExists` is expected); `aws iam list-open-id-connect-providers` shows how many exist.
