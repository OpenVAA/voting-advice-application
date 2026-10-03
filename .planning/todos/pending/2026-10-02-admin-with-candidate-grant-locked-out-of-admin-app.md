---
created: 2026-10-02
title: An administrator who also holds a candidate editor grant is signed out of the Admin App (role resolves to candidate)
area: apps/frontend/src/lib/api/adapters/supabase/dataWriter
severity: follow-up
source: Phase 168 (docs-site rewrite), 168-06 finding F6 (read, not run), filed by plan 168-08
related_phase: 168
files:
  - apps/frontend/src/lib/api/adapters/supabase/dataWriter/supabaseDataWriter.ts (`_getBasicUserData`)
  - apps/frontend/src/routes/admin/(protected)/+layout.ts
  - apps/frontend/src/lib/server/admin/requireAdminIdentity.ts
  - apps/frontend/src/routes/admin/login/+page.server.ts
---

## Problem

An identity that holds **both** an admin grant and a candidate (entity editor) grant can log in to the Admin App, but every protected
admin page then signs it out with `userNotAuthorized`. This was read from the code, not run, so it is UNCONFIRMED.

1. The admin login admits the identity, because its `ADMIN_GRANTS` match: `apps/frontend/src/routes/admin/login/+page.server.ts` has
   `allowedGrants: ADMIN_GRANTS,`.
2. `_getBasicUserData` tests the candidate arm first, `if (hasAnyGrant(grants, CANDIDATE_GRANTS)) {`, and only then
   `} else if (hasAnyGrant(grants, ADMIN_GRANTS)) {`. So the identity's role resolves to `candidate`.
3. The protected admin layout requires `admin`: `apps/frontend/src/routes/admin/(protected)/+layout.ts` has
   `if (userData.role !== 'admin') return await handleError('userNotAuthorized');`. `requireAdminIdentity.ts` does the same:
   `?.role !== 'admin') return { outcome: 'forbidden' };`.

The code comment justifies the ordering with "the two apps are reached by different routes anyway". That holds for the Candidate App,
but not for the Admin App gate, because both gates read the same single role.

## Decide (operator)

Is a dual-grant identity a supported case? An administrator who also maintains their own candidate entity is plausible in a small
deployment.

- **If supported:** derive the role per app rather than once. For example, the admin gates check `hasAnyGrant(grants, ADMIN_GRANTS)`
  directly, or `getUserData` takes the app context. Add a unit test for the dual-grant identity on both gates.
- **If not supported:** reject the combination where grants are written, and state the rule.

The Admin app docs page (`/developers-guide/admin-app`) states the current behaviour.
