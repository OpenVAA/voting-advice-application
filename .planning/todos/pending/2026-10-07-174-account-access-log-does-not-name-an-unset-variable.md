---
created: 2026-10-07T13:50:00.000Z
title: account-access logs ERR_ENV_UNCONFIGURED without the variable's name, and a file served with --env-file silently strips the other functions' variables
area: apps/supabase - Edge Functions / operations
severity: minor
source: Phase 174 (the red bank-auth-journey run of 174-10's close, label 174-10-bank-auth-journey; filed by 174-10)
files:
  - apps/supabase/supabase/functions/account-access/linkIssue.ts
  - apps/supabase/supabase/functions/account-access/index.ts
  - apps/supabase/supabase/functions/account-access/envConfig.ts
  - tests/IDURA-TEST-RUNBOOK.md
---

## Problem

Observed once on a served function, at 2026-10-07T13:41:36Z. The bank-auth driver served the Edge runtime with a generated file that held the identity provider's variables, `PUBLIC_PROJECT_ID` and `SITE_URL`, and no SMTP variable. `supabase functions serve --env-file` replaces the function environment of every function the runtime serves, so `account-access` ran without `SMTP_HOST`, `SMTP_PORT` and `SMTP_FROM`. A link request for an invited address then logged exactly one line:

`[Error] account-access: a link could not be issued or mailed; its slot is given back {"name":"Error","code":"ERR_ENV_UNCONFIGURED"}`

The request's witness did not read `sent`, and the E2E journey failed in its registration step with "inviteByEmail: the link request finished without handing a mail over".

Two things made this slower to read than it needed to be:

- **The log line does not name the variable.** `requireEnv` throws an error whose message names it (`Missing required environment variable: SMTP_HOST.`) and which also carries a `variable` property, but `describeFailure` in `linkIssue.ts` keeps only a `name` and a `code` that are short safe tokens, by design: a failure's message can quote an address. So an operator sees that some variable is unset and not which. That the variable was `SMTP_HOST` is inferred from the order of the `requireEnv` calls in `sendMail`, not read from the log.
- **By then the user already exists.** The SMTP variables are read when the mail is sent, after `createPasswordlessUser` and `mintToken`. A deployment with a missing SMTP variable creates an account for every eligible address that asks, mails nothing, and gives the slot back each time.

This was also the first time the "slot is given back" branch ran on a served function. Only its log line was read: whether the throttle row was in fact deleted was not checked.

## Solution

- Let `describeFailure` keep `variable` when the error's code is `ERR_ENV_UNCONFIGURED` and the value is a short safe token: a variable's name is configuration, not user data. Extend `linkIssue.test.ts` (the log never receives an address) with the new field.
- Read and validate the three SMTP variables when the link issue's dependencies are built, beside `SITE_URL`, so that an incomplete deployment logs `the link issue could not start; no link issued` and creates no user. Keep the no-`await`-before-the-return property the conformance test pins.
- For whoever serves the functions with `--env-file` locally: the file is the whole function environment. The runbook's generated file and the bank-auth driver now carry the three SMTP lines for this reason.
