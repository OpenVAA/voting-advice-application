---
created: 2026-11-15T00:00:00.000Z
title: The grant-holder arm of invitation_link_request may read every row of auth.users for a link request that finds no open invitation - unconfirmed sequential scan
area: database
severity: minor
source: Phase 174 (the scan paragraph of the todo 2026-10-07-174-no-per-caller-limit-on-the-anonymous-invitation-operations, filed by 174-10); moved here by plan 188-16 when that todo closed (phase 188, E-07)
owner: a later database phase
files:
  - apps/supabase/supabase/schema/506-invitation-rpcs.sql
  - apps/supabase/supabase/migrations/00023_invitation_caller_limit.sql
---

## Problem

Inferred from the index definitions of `auth.users` and not measured with an `EXPLAIN`: the grant-holder arm of `invitation_link_request` compares `lower(btrim(u.email))`, which neither `users_email_partial_key` nor `users_instance_id_email_idx` serves, so each link request without a code that finds no open invitation reads every row of `auth.users`.

When this was filed in phase 174, nothing limited how often an anonymous caller could ask, so the scan was one any caller could cause at will. Since phase 188 the per-caller limit bounds that: `account-access` takes a slot of `public.invitation_caller_take` (migration `00023_invitation_caller_limit.sql`) before any work of `request-link`, 30 takes per caller per project per 10 minutes across `check-code`, `request-link` and `request-recovery`, keyed on `cf-connecting-ip` behind Cloudflare. It was seen refusing one caller at its 31st call on the hosted function while another was answered (`.planning/workstreams/deployment/phases/188-relay-on-the-deployed-stack-and-the-per-caller-limit/evidence/188-16-hosted-limit.md`). A single caller can therefore cause the scan at most 30 times in 10 minutes. A caller with many addresses, or many callers, still can cause it more often, and a deployment not behind Cloudflare has no per-caller limit at all.

## Solution

- Confirm the scan with `EXPLAIN` on a database holding a realistic number of users.
- Then either compare `u.email` with the already-normalised argument so an existing index serves it (first confirm that the auth service stores addresses trimmed and lower-cased; that is assumed here, not measured), or add an expression index, or stop the grant-holder arm from running for an address with no account.
