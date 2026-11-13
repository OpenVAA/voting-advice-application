---
created: 2026-10-22T14:00:00.000Z
title: identity-callback finds a returning identity by listing every auth user of the instance, a thousand at a time, on each sign-in
area: Edge Functions / bank authentication / performance
severity: minor
source: Phase 179 (179-CONTEXT.md § Pre-existing OIDC defects on record and decision D-22; filed by 179-23)
owner: unassigned
files:
  - apps/supabase/supabase/functions/identity-callback/index.ts (`findUser`, `findUserByIdentityMatch`, `findUserByPlaceholderAddress`)
  - apps/supabase/supabase/functions/identity-callback/appMetadata.ts (`identity_match_value`, written by `identityAppMetadata`)
---

## Problem

`identity-callback` looks up the account of an identity the provider has just verified with `findUserByIdentityMatch`. That function calls `findUser`, which pages through `supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 })`. It stops at the first account whose `app_metadata.identity_match_value` equals the identity's match value, or at the first page shorter than 1000. On the path where creating a new account answers `email_exists`, `findUserByPlaceholderAddress` pages through the users again, the same way.

- **Cost.** It grows with the number of auth users on the instance, not in the project. The users of every project the instance serves are listed, along with administrators and email-registered contestants. A returning identity near the end of the list, or a new one, which is never found, costs `ceil(users / 1000)` admin API calls on every sign-in, before the function answers. Each call returns whole user objects to the function.
- **Exposure.** The trigger is narrower than before. The function now refuses every caller without the frontend server's `x-identity-callback-secret` (179-15), and the OIDC callback calls it only after a completed provider round trip with a verified ID token. So an anonymous caller can no longer make the function list the users; a person with a bank identity can, once per sign-in.
- **Not measured.** No run on this branch has more than a few hundred auth users. The page size and the stop rule were read from the code.

## Solution

Find the account by an indexed read instead of a list:

- A `SECURITY DEFINER` function in `private` (EXECUTE for `service_role` alone, `search_path = ''`) that returns the id of the `auth.users` row whose `raw_app_meta_data ->> 'identity_match_value'` equals its argument. Give it an expression index on that key. Also add a variant, or a second function, for the placeholder address (`auth.users.email` is already indexed).
- Or: keep the match value in a table of its own (`private.identity_accounts (match_value text primary key, user_id uuid references auth.users on delete cascade)`), written in the same step that writes the `app_metadata` record.

Either way, it is an appended migration with its `schema/` edit and manifest line, and pgTAP covers the function's grant and its answer. `identity-callback/flowConformance.test.ts` should then assert that `listUsers` is gone from the function.

Related: `2026-10-07-174-nothing-type-checks-the-edge-functions.md`. The function's admin-client calls are typed by nothing, so a renamed RPC would first fail at run time.
