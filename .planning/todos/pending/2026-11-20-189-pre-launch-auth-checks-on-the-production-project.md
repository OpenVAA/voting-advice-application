---
created: 2026-11-20T00:00:00.000Z
title: Pre-launch auth checks on the production project - the identity-callback secret on both sides and the shared per-address sign-in budget, neither settled by a read
area: deployment / auth
severity: major
source: Phase 189 (G-03)
owner: the operator of the production project, before it goes live
files:
  - apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md
  - apps/supabase/supabase/functions/account-access/index.ts
  - apps/supabase/supabase/functions/identity-callback/index.ts
---

## Problem

The hosted-auth todo (`.planning/todos/completed/2026-10-07-174-hosted-project-auth-settings-allowlist-and-function-variables.md`)
closed in phase 189. The Terraform module now writes the auth switches, the redirect allowlist and the
functions' variables, and the conformance probe checks them. Plan 189-05's probe run on the
persistent (staging) project passed all 22 checks on 2026-11-20. Two of that todo's asks are about
behaviour, and no probe row reads them, so they move here:

- the `identity-callback` secret beyond the keyless refusal, which staging cannot show today because
  bank authentication is not wired on the AWS task (`2026-11-20-189-bank-authentication-on-the-aws-task.md`);
- whether the server-side password sign-ins share one per-address sign-in budget.

What a read did settle is not repeated here. The Email OTP Length is 10 on the persistent project
(`auth.other-settings` PASS). A keyless POST to `identity-callback` is answered `401 refused`
(`functions.identity-callback-unverified` PASS). Both are probe checks, so one probe run on the production project
(`node infra/scripts/probe-hosted.mjs --root infra/envs/<environment>/supabase`, the conformance
probe of `developers-guide/deployment`) covers them there. The record is
`.planning/workstreams/deployment/phases/189-documentation-and-closure/evidence/189-17-identity-callback-check.md`.

Use test accounts and test codes only, never a real user's address.

## Check: the identity-callback secret on both sides

Needs a deployment where bank authentication is wired. `IDENTITY_CALLBACK_SERVER_SECRET` is one
random value of at least 32 bytes (`openssl rand -hex 32`), set as a function secret of the project
(read by `identity-callback`) and as a private variable of the frontend service (read through
`$lib/server/constants`). It is not a `PUBLIC_` variable. Observe each of these once and record the
result where this todo is closed:

1. A POST to `<project url>/functions/v1/identity-callback` with the anon key and an
   `x-identity-callback-secret` header carrying a wrong value answers `401 {"result":"refused"}`
   (`identity-callback/index.ts`, the second `refused` return).
2. With the function secret unset, a POST that carries any header answers `500 {"result":"configuration"}`,
   and the function's log names `IDENTITY_CALLBACK_SERVER_SECRET`.
3. With the frontend variable unset, a bank sign-in ends on the identity provider's error screen with
   `configuration_error`, and the function is never called.
4. With both set to the same value, a bank sign-in completes.

Checks 2 and 3 are made on a throwaway or not-yet-live project, never on the production project once
it serves voters.

## Check: the shared per-address sign-in budget

The code sign-in (`account-access` `code-sign-in`) calls `signInWithPassword` from the edge runtime,
and the email sign-in calls it from the frontend server. The auth service counts sign-ins per address
of origin (`[auth.rate_limit] sign_in_sign_ups`, 30 per five minutes locally). Every user's attempts
through one server may therefore share that server's budget, as the authentication page states under
§ Known residuals.

1. From one client, send 31 wrong-password code sign-ins inside five minutes. The per-code budget
   stops at ten, so use four test codes.
2. Then, from a client on another network, sign in once with correct credentials by email, and once
   by code.
3. A refusal with the rate-limit answer (`429`, `over_request_rate_limit`) means the budget is
   shared. Success while the first client is refused means the auth service counts the person's
   address.
4. Repeat with the email sign-in as the failing path. The edge runtime and the frontend server reach
   the auth service from different addresses, so one result does not settle the other.

If the budget is shared, the remedies are a trusted forwarded-address header from both servers or a
higher `Rate limit for sign-ups and sign-ins`. The fuller procedure, including the auth-log read, is
in `.planning/todos/pending/2026-10-26-179.1-deployment-measure-the-shared-sign-in-budget-on-a-hosted-project.md`.
Close both todos together, and update the residual on the authentication page.
