---
created: 2026-10-07T12:53:29.000Z
title: The auth callback keeps its signup and email arms, although verifying either sets a temporary password for an invited passwordless user
area: apps/frontend - auth / security
severity: major
source: Phase 174 (item 16 of 174-01-PLAN.md; 174-RESEARCH.md RQ-2; 174-09-SUMMARY.md § Observations for the operator; filed by 174-10)
owner: Phase 178
files:
  - apps/frontend/src/routes/api/auth/callback/+server.ts
  - apps/frontend/src/routes/api/auth/callback/server.test.ts
  - apps/supabase/supabase/functions/account-access/index.ts
---

## Problem

The callback refuses a link of the type `invite` before verifying it, because verifying such a token writes a password nobody chose into the account. The research (RQ-2, private GoTrue `v2.197.0`) measured the same effect for two more types: verifying a token as `signup` or as `email` for an invited user who has no password also sets a temporary password.

The callback still has both arms: `email` and `signup` verify, claim, refresh and land on the validated `next` path or the Contestant App's root. Only `invite` was removed, as the plan directed.

What stands between this and a user:

- Nothing in the product issues a `signup` or `email` token for an invitee (name map row J4 lists every place the tree names a link type). `account-access` mints `magiclink` only, and public sign-up is closed, so the auth service sends no sign-up confirmation mail. Which of its own mails the auth service issues with the type `email` was not established here; its `POST /otp` is the open path (see the todo on that endpoint).
- So the arms are reachable only with a token the auth service issued outside the application's own flows, or on a deployment whose sign-up is open. On such a deployment the account-level consequence is that `password_set` reads true for a user who chose none, and the callback then sends them past the set-password page (see the todo on identity-provider accounts reading as password-set).

Not re-measured on the local stack by Phase 174, and no run was made against these two arms with an invited user.

## Solution

For Phase 178, which owns the callback's remaining arms together with the recovery mail:

- Decide whether the application has any use for `signup` and `email` links. If none, refuse both as `invite` is refused (`REFUSED_TYPE` becomes a set), with the unit test that pins the refusal extended to them.
- If a flow that needs either type is planned, keep that arm and make it independent of `password_set` as a first-time signal.
- Re-measure RQ-2 on the pinned CLI's auth service first: the behaviour is the auth service's, and a version change may have moved it.

## Resolution

**Closed 2026-10-16 by Phase 178** (plan 178-14). The application has no use for either type: the callback refuses `invite`, `signup` and `email` before verifying, as one set (`REFUSED_TYPES` in `apps/frontend/src/routes/api/auth/callback/+server.ts`). Pinned by the unit case `refuses a link of the type %s whatever next it names, and verifies and claims nothing` of `server.test.ts`, run for each of the three types. The callback no longer reads `password_set` to land a user: the set-password gate of the protected layout asks it on every load. RQ-2 was not re-measured on the pinned auth service, because no arm that verifies either type is left.
