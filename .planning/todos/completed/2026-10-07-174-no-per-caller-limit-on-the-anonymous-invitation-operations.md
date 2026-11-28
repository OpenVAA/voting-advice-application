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
completed: 2026-11-19
status: completed
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

## Closed (phase 188), 2026-11-19

Closed by plan 188-16 on its record, `.planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/evidence/188-16-hosted-limit.md`.

- **What was built.** Migration `00023_invitation_caller_limit.sql` adds `public.invitation_caller_take(p_project_id uuid, p_address text)`, which only `service_role` may execute. It takes a slot under a `caller:<project>:<address>` key of `private.invitation_throttle`, 30 takes per caller per project per 10 minutes, with IPv6 keyed by its /64. It trusts the address only when `private.deployment_settings.behind_cloudflare` is true; otherwise the limit is skipped, with no shared bucket. `account-access` reads `cf-connecting-ip` and takes the slot before any work of `check-code`, `request-link` and `request-recovery`, answering a refused caller with HTTP 429, `Retry-After` and `{ error: 'too-many-requests' }`. `code-sign-in` and `confirm-address` take no slot (CONTEXT E-03). The migration reached the hosted project `cofbsatfrdysyphajsky` in deploy run 44491292876 at commit `a7003b490` (188-10), before the function.
- **R-d, the hosted caller topology.** 184-13 measured it: behind Cloudflare, every served request carries the client in `cf-connecting-ip`, and Cloudflare refuses a client-sent value. The hosted project's `behind_cloudflare` read `true` at 184-22, and none of the 22 migrations applied since writes it.
- **R-a and R-b, seen limited on the hosted function.** AWS CloudShell got 30 answers of 200 to `check-code` and was refused with 429 at its 31st call (09:59:32Z, `Retry-After: 593`). The workstation, another caller, was answered 200 at 10:00:11Z in that same window. It was refused at its own 31st call (`Retry-After: 589`, the same body) and answered 200 again at 10:10:18Z, after its window. No address was recorded. One caller can now make at most 30 code checks, link requests and recovery requests per project in 10 minutes, so the one-a-minute mail to an eligible address is also bounded per caller.
- **What remains.** A caller with many addresses gets one bucket per address, so the limit does not bound it. Callers who share one address, such as a carrier NAT, an office or a school, share one bucket and can deny each other for up to 10 minutes; a dedicated message for that stays deferred. A deployment not behind Cloudflare has no per-caller limit. The redirect question's `GET /auth/v1/verify` draw described above was not measured and is not covered here.
- **Moved.** The unconfirmed sequential scan of `auth.users` in `invitation_link_request` moves to `.planning/todos/pending/2026-11-15-invitation-link-request-sequential-scan.md`.
