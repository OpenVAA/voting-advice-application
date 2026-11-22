---
created: 2026-10-07T12:53:29.000Z
title: What a hosted project must have set before it holds an invitation - two dashboard switches, the redirect allowlist entry and the function's variables - none of it observed on a hosted project
area: deployment / auth / Edge Functions
severity: major
source: Phase 174 (item 1, item 8 and item 23 of 174-01-PLAN.md; assumption A2 and A10 of the research, both "not measurable here"; 174-05 measurements E1, E4, E5; filed by 174-10)
owner: the operator of any hosted project
files:
  - apps/docs/src/routes/(content)/developers-guide/deployment/+page.md
  - apps/supabase/supabase/functions/account-access/index.ts
  - apps/supabase/supabase/functions/account-access/deploymentChecks.ts
  - apps/supabase/supabase/functions/.env.example
  - apps/supabase/supabase/config.toml
completed: 2026-11-20
status: completed
---

## Problem

The invitation model depends on four things the repository cannot set for a hosted project. The deployment page (§ Auth settings of a hosted project, § The sign-in link of an invitation) states them; this todo is the reminder that somebody has to do them, and the record of what was never observed.

1. **Two dashboard switches**: public sign-up off, email confirmation on. Their names in the docs ("Allow new users to sign up", "Confirm email") were quoted from the phase's plan and never checked against a hosted dashboard. The check that does not depend on a label: `GET <project url>/auth/v1/settings` with the anon key must hold `"disable_signup": true` and `"mailer_autoconfirm": false`.
2. **The redirect allowlist** must admit `<SITE_URL>/*/api/auth/callback` (the callback behind one locale segment), beside `<SITE_URL>/api/auth/callback` for the recovery mail. The older todo `2026-09-02-deployment-guide-production-redirect-allowlist.md` asked for this to be documented and names the path as it was then.
3. **`SITE_URL`** of the functions: the frontend's public origin, with no path, query or fragment. It is the origin of every mailed link.
4. **`SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`** (and `SMTP_USER`, `SMTP_PASS` where the server needs them) for `account-access`, which sends through `nodemailer` with `secure: false`.

`account-access` issues no link, and logs one line saying why, when the served settings allow public sign-up or the allowlist refuses the callback URL. So a mistake in 1 or 2 shows as "invited people receive no mail" and a line in the function's log, and a mistake in 4 as "a link could not be issued or mailed; its slot is given back".

**What was never observed, anywhere:**

- Either refusing branch on a served function. Both are held by unit tests with injected answers (`linkIssue.test.ts`, `deploymentChecks.test.ts`) and by a source-level conformance test; the local stack passes both checks, and no live run was made against an auth service that fails one.
- The release of a slot after a failed send on a served function: `linkIssue.test.ts` with a failing transport, and pgTAP for `invitation_link_release`; no test makes the SMTP transport fail. One unplanned observation exists: in the red bank-auth run of 174-10's close the served function ran without its SMTP variables and logged `account-access: a link could not be issued or mailed; its slot is given back` with the code `ERR_ENV_UNCONFIGURED`. Only the log line was read, not the throttle row. See `2026-10-07-174-account-access-log-does-not-name-an-unset-variable.md`.
- In that same run the function's `SITE_URL` was `http://127.0.0.1:5273`, and its redirect check must have passed for `http://127.0.0.1:5273/en/api/auth/callback`, because the one line it logged is from the mail step, which runs after both checks. The local allowlist names `localhost:5173` only, and the auth service's site URL is `http://127.0.0.1:5173`. Inferred from that, not measured: the auth service also admits a redirect on its own site URL's host name, whatever the port. If so, the allowlist entry is sufficient and not necessary, and the function's check does not prove that the entry is there.
- A hosted project at all: whether its gateway accepts a call carrying the anon key alone (locally it does, and a call with no key is refused with 401 before the function), which forwarded headers it sets, how long a background task may run after the response there, and whether the `Location` of `/auth/v1/verify` reads there as it does locally (admitted: the requested URL; refused: the auth service's own site URL).
- The redirect question draws on whatever verification limit the hosted auth service applies to the function's own address.

## Solution

On the first hosted deployment, in this order:

1. Set the two switches and read `/auth/v1/settings`.
2. Add the allowlist entries, set `SITE_URL` and the SMTP variables as secrets of the project, deploy the three functions.
3. Send one `check-code` request with the anon key (does the gateway let it through?).
4. Seed one invitation for an address you control, send one `request-link`, read the function's log (no line means both checks passed), open the mail, and confirm the link's origin and that it signs in.
5. Flip each of the four things wrong in turn on a throwaway project and read the log line, so that both refusals and the failed send are observed once on a served function. Record the result where this todo is closed.

## Update 2026-10-16 (Phase 178 close): two more settings, documented; still not observed on a hosted project

Phase 178 pinned two more auth settings locally (plan 178-20) and wrote all of them into `developers-guide/deployment` § Auth settings of a hosted project (plan 178-23), with the repository's value and the statement that the repository cannot enforce any of them:

| Dashboard setting | `config.toml` key | Value |
| --- | --- | --- |
| Allow new users to sign up | `[auth] enable_signup` | off |
| Confirm email | `[auth.email] enable_confirmations` | on |
| Minimum password length | `[auth] minimum_password_length` | 8 |
| Email OTP Expiration | `[auth.email] otp_expiry` | 3600 seconds, the lifetime of a mailed link |
| Send Email hook, of the Postgres type | `[auth.hook.send_email]` | enabled, `public.send_email_hook` |

What probe row P5 measured beside the length (local stack): a user's own `updateUser` and an administrator's `createUser` with seven characters are refused `422 weak_password`; an account whose seven-character password predates the setting still signs in.

**Still open, for whoever deploys:** none of these was observed on a hosted project, and the dashboard's labels are unverified. The served-settings request (`/auth/v1/settings`) shows the two sign-up values only; the length, the link's lifetime and the hook are read in the dashboard. Under the hook a change of address asked through the auth service gets no confirmation mail (`P6-EMAIL-CHANGE: no mail`), so Phase 179 sends that confirmation itself if it offers a change of address.

## Update 2026-10-22 (Phase 179, plan 179-15): one more variable, on two services

`identity-callback` now answers the frontend server alone. A hosted deployment must set **`IDENTITY_CALLBACK_SERVER_SECRET`**, one random value of at least 32 bytes generated once per deployment (for example `openssl rand -hex 32`), in two places with the same value:

- as a function secret of the hosted project, read by `identity-callback` (`supabase secrets set`, or the dashboard's function secrets);
- as a private environment variable of the frontend service (Render or wherever it runs), read by the identity provider's callback through `$lib/server/constants`. It is not a `PUBLIC_` variable.

What to observe on the first hosted deployment:

1. A POST to `<project url>/functions/v1/identity-callback` with the anon key and no `x-identity-callback-secret` header answers `401 {"result":"refused"}` (the function reads nothing first).
2. With the function secret unset, a POST that carries any header answers `500 {"result":"configuration"}`, and the function's log names `IDENTITY_CALLBACK_SERVER_SECRET`.
3. With the frontend variable unset, a bank sign-in ends on the identity provider's error screen with `configuration_error`, and the function is never called.
4. With both set, the sign-in completes.

None of these was observed on a hosted project; locally the E2E wrapper generates a secret per run and the gate row `fn-closed` and the stack probe check (1) on the running stack.

## Update 2026-10-22 (Phase 179, review fix WR-02): "Secure email change" is a required setting

The address confirmation of an identity-provider account (`account-access` `confirm-address`) confirms the placeholder's side of the change of address itself and mails only the typed address's link. That relies on the auth service's secure change of address, which asks for both confirmations:

| Dashboard setting | `config.toml` key | Value |
| --- | --- | --- |
| Secure email change | `[auth.email] double_confirm_changes` | on |

With it off, confirming the placeholder's side completes the change at once, without the typed address being proved. The function then puts the placeholder back, mails nothing and answers `refused`, and logs `the current address's link completed the change of address alone; the placeholder is put back`, so no identity-provider account can prove an address on such a project. The row is now in `developers-guide/deployment` § Auth settings of a hosted project. `assert:hosted-settings-parity` already holds the Terraform module's `mailer_secure_email_change_enabled` equal to the local `double_confirm_changes` (a "must agree" row; its rationale now names the address confirmation).

What to observe on the first hosted deployment: the setting reads on in the dashboard, and one identity-provider registration's confirmation mail arrives and, opened, makes the typed address the account's. Not observed on a hosted project; the label "Secure email change" is unverified.

## Update 2026-10-22 (review fix A, 174 WR-03): the one-time code is ten digits

Every link `account-access` has the auth service mint (`magiclink`, `recovery`) also stores a one-time code for the address, which `POST /auth/v1/verify` accepts with `{ email, token }` in the link's place while the link lives. The application never uses it, but an anonymous caller can have a link sent to any invited address, and six digits can be guessed within `otp_expiry` against the per-IP `token_verifications` limit. The local file now holds the auth service's maximum:

| Dashboard setting | `config.toml` key | Value |
| --- | --- | --- |
| Email OTP Length | `[auth.email] otp_length` | 10 |

`assert:auth-signup-closed` requires it for the local file, `infra/modules/supabase/hosted-settings.json` sets `mailer_otp_length: 10`, and `assert:hosted-settings-parity` holds the two equal (its existing "must agree" row; the rationale names the guessing). The row is in `developers-guide/deployment` § Auth settings of a hosted project.

What to observe on the first hosted deployment: the dashboard's Email OTP Length reads 10. Not observed on a hosted project; the label is unverified.

## Update 2026-10-22 (review fix A, 174 IN-04 / 178 IN-05): the server-side sign-ins share a per-IP budget

The code sign-in (`account-access` `code-sign-in`) calls `signInWithPassword` from the edge runtime, and the email sign-in calls it from the frontend server. The auth service counts sign-ins per address of origin (`sign_in_sign_ups`, 30 per five minutes locally), so on a hosted project every user's attempts through one of those servers probably share that server's budget, and a caller sending wrong passwords can exhaust it for everyone. Recorded as a residual in `developers-guide/backend/authentication` § Known residuals and at the call in `account-access/index.ts`; nothing in the repository changes it.

What to observe on the first hosted deployment: send 31 wrong-password code sign-ins with one used code inside five minutes (the per-code budget stops at ten, so use four codes), then one correct sign-in by email from another network. If it is refused with a rate-limit error, the budget is shared; the remedies are a trusted forwarded-address header from both servers or a higher `Rate limit for sign-ups and sign-ins`. Not observed on a hosted project.

## Closed (phase 189), 2026-11-20

Closed by plan 189-17 on its record, `.planning/workstreams/deployment/phases/189-documentation-and-closure/evidence/189-17-identity-callback-check.md`.

- **What was built.** Phase 184 built the Terraform module `infra/modules/supabase/`, which now writes what this todo asked an operator to set by hand. `supabase_settings.this` sends the auth settings of `hosted-settings.json`: sign-up off, email confirmation on, the minimum password length, the link's lifetime, secure email change, the ten-digit Email OTP Length and both hooks. It also sends the redirect allowlist. `supabase_edge_function_secrets.this` (`function-secrets.tf`) sets `SITE_URL`, `PUBLIC_PROJECT_ID` and the SMTP secrets. `assert:hosted-settings-parity` holds the module's values equal to the local `config.toml`. `developers-guide/deployment/hosted-settings` lists each setting with the check that verifies it (plans 189-08 and 189-12). The conformance probe passed all 22 checks on the persistent project on 2026-11-20, after the function deploy of 2026-11-19, including `auth.other-settings` (the OTP length is served as 10), `functions.verify-jwt` and `functions.identity-callback-unverified` (a keyless POST is answered `401 refused`). The record is `.planning/workstreams/deployment/phases/189-documentation-and-closure/evidence/189-05-staging-reads.md`. Several items of "What was never observed" were observed on a throwaway hosted project in phase 184: a link mail delivered through SES, the redirect allowlist's five cases with `/auth/v1/verify` answering 303, and a failed send giving its slot back (`.planning/workstreams/deployment/phases/184-hosted-supabase-measurement-and-conformance-probe/evidence/184-16-throwaway-mail-redirects-slot.md`). The forwarded headers a hosted gateway sets were also measured there (`evidence/184-13-throwaway-headers-timeout-drift.md` of that phase). The dashboard labels no longer matter, because the module sets the values and the probe reads them.
- **What remains.** Two asks no read settles. First, the `identity-callback` secret beyond the keyless refusal: one value set on both sides, a wrong-secret POST refused, the two unset-variable answers, and a completed bank sign-in. Staging cannot show these today, because bank authentication is not wired on the AWS task and `function-secrets.tf` sets no `IDENTITY_CALLBACK_SERVER_SECRET` (`.planning/todos/pending/2026-11-20-189-bank-authentication-on-the-aws-task.md`). Second, whether the server-side password sign-ins share one per-address sign-in budget. Not re-checked by this plan: the refusal `account-access` gives when the served settings allow public sign-up, which needs a project whose sign-up is open.
- **Moved.** Both asks, each with its check, to `.planning/todos/pending/2026-11-20-189-pre-launch-auth-checks-on-the-production-project.md`. The sign-in budget's fuller procedure stays in `.planning/todos/pending/2026-10-26-179.1-deployment-measure-the-shared-sign-in-budget-on-a-hosted-project.md`.
