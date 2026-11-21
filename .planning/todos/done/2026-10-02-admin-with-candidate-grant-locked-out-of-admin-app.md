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

## Resolution 2026-11-12 (Phase 179.2): built, supported

The dual-grant identity is supported (179.2 D-04).

- **The Admin App admits on `ADMIN_GRANTS`.** The universal `admin/(protected)/+layout.ts` single-role check was replaced by a server load, `admin/(protected)/+layout.server.ts`, which matches the verified session's grants against `ADMIN_GRANTS` (`hasAnyGrant(readSessionGrants(session), ADMIN_GRANTS)`) before anything is read. A user who also holds an entity editor grant is admitted (unit case in `protectedGroup.server.test.ts`).
- **The role resolution already read the admin grant first.** `_getBasicUserData` tests `ADMIN_GRANTS` before `CONTESTANT_GRANTS` since commit `f8c369121`, with a unit case pinning the order; it was not changed here, and the Contestant App decides on its entity list, not on the role.
- **The Contestant App's fallback leaves such a user alone.** Its protected load redirects to the Admin home only a session that `isAdminOnly` reads as admin-only (an admin grant and no contestant grant).
- **Evidence (E2E):** `tests/tests/specs/admin/admin-account-flows.spec.ts` › "a user who holds an admin grant and a candidate's editor grant signs in to both apps and reaches each home". Its red was shown by two mutations, one per app (ledger rows 179.2-04-3 and 179.2-04-4).
- **Docs:** `/developers-guide/admin-app` § Access says that a user who also holds an entity editor grant is admitted and uses both apps.

