---
created: 2026-11-23
title: Drop the invitation_caller_take wrapper once every deployment runs the renamed functions
area: database
severity: minor
source: phase 189.1 close-out list (operator, 2026-11-22)
owner: a later database phase
files:
  - apps/supabase/supabase/migrations/00004_access_caller_limit.sql
---

## Problem

Migration `00004_access_caller_limit.sql` adds `public.access_caller_take` and keeps `public.invitation_caller_take` as a wrapper that returns what the new function returns, with the same privilege (the service role alone). The wrapper exists only for an `account-access` function deployed before the rename, which still calls the old name, and for a rollback to such a function. The migration says a later migration drops it.

## Done when

- Every deployment (staging and any other hosted project) runs Edge Functions that call `public.access_caller_take`, which is checked on each project and not assumed. A rollback past that point is no longer supported.
- A new migration drops `public.invitation_caller_take (uuid, text)`, and the pgTAP tests and `yarn db:lint:sql` pass on it.
- No function, test or script under `apps/` and `tests/` names `invitation_caller_take` any more.
