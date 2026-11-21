---
created: 2026-10-07T12:53:29.000Z
title: No per-caller limit exists on the three anonymous invitation operations - unlimited code checks, one mail a minute to any eligible address, and an unmeasured hosted caller topology
area: Edge Functions / database / operations
severity: major
source: Phase 174 (item 5 and residuals R-a, R-b, R-d of 174-01-PLAN.md; 174-04-SUMMARY.md § The residual of deviation 2; 174-05 measurement E7; filed by 174-10)
owner: Phase 178 and the operator of any hosted deployment
files:
  - apps/supabase/supabase/functions/account-access/index.ts
  - apps/supabase/supabase/schema/506-invitation-rpcs.sql
  - apps/docs/src/routes/(content)/developers-guide/backend/authentication/+page.md
---

## Problem

`174-CONTEXT.md` asks for "a cap per caller" (D-15) and "a coarse per-caller limit for unknown codes" (D-18). Neither is built, because no identity of the caller is observable that the caller cannot choose. What stands instead is keyed on what a request is about: one sign-in mail per address per project per 60 seconds, one binding per code row per 60 seconds, ten claimant look-ups per used code per fifteen minutes. Three things follow, each by its mechanism.

1. **Anonymous code checks are unlimited (R-a).** `invitation_code_status` for any string, and `invitation_link_request` and `invitation_code_claimant_email` for a code that names no claimed row, are counted by nothing. Each costs one indexed look-up and writes nothing. An unknown code is defended by its 60 bits alone; the exposure is load on the database, not disclosure.
2. **One mail per minute to any eligible address, for as long as someone asks (R-b).** Anyone who knows an address that has an open invitation, or that belongs to a user holding a grant in the project, can make the deployment mail it a sign-in link every 60 seconds indefinitely. The slot bounds the rate, not the duration, and cannot tell the address's owner from anyone else.
3. **The hosted caller topology is unmeasured (R-d).** On the local stack the function saw the same `x-forwarded-for` and `x-real-ip` (`192.168.65.1`, the container network's gateway) for every caller, and no `cf-connecting-ip` or `sb-forwarded-for` (174-05, E7; header names listed in `174-NAME-MAP.md`). So "no caller identity is observable" is a statement about the local stack. What a hosted gateway sets was not measured, and the function reads none of these headers (its conformance test pins that).

One more cost on the same path, inferred from the index definitions of `auth.users` and not measured with an `EXPLAIN`: the grant-holder arm of `invitation_link_request` compares `lower(btrim(u.email))`, which neither `users_email_partial_key` nor `users_instance_id_email_idx` serves, so each link request without a code that finds no open invitation reads every row of `auth.users`. With item 1 that is a sequential scan any anonymous caller can cause at will.

A related draw, also unmeasured: the function's redirect question is a `GET /auth/v1/verify` with an invalid token, at most once per callback URL per ten minutes per worker. On a deployment whose auth service limits verifications per forwarded address, those calls count against whatever bucket the function's own address falls in.

## Solution

- **Do not add a project-wide cap.** Any visitor could use it to deny the answer to everyone.
- Find an identity for the caller that the caller cannot influence on the hosted deployment: a gateway-set address the Edge Function can trust (the feedback limit's `behind_cloudflare` setting is the precedent in `107-feedback.sql`), or a limit at the gateway itself, or a captcha on the screens of Phase 178. Measure the headers a hosted project's gateway sets before choosing.
- Then key a coarse limit on it for the unknown-code paths.
- For the scan: confirm it with `EXPLAIN` on a database holding a realistic number of users, then either compare `u.email` with the already-normalised argument so an existing index serves it (first confirm that the auth service stores addresses trimmed and lower-cased; that is assumed here, not measured), or add an expression index, or stop the grant-holder arm from running for an address with no account.
- Until then the deployment page tells an operator to put a rate limit in front of the function at its gateway.
