---
created: 2026-10-07T12:53:29.000Z
title: ADMIN_GRANTS lists admin shapes only, so a claimed (project, editor) promise is held and opens neither app
area: Admin app / auth
severity: major
source: Phase 174 (ruling 18 of 174-01-PLAN.md; name map fact X1; 174-08-SUMMARY.md § For Phase 178; filed by 174-10)
owner: the Admin App's phase
files:
  - apps/frontend/src/lib/auth/roles.ts
  - apps/frontend/src/routes/admin/login/+page.server.ts
  - apps/frontend/src/lib/auth/passwordLogin.ts
  - apps/supabase/supabase/schema/305-invitations.sql
---

## Problem

An invitation can promise a project `editor` grant: the authority map admits it (`project.manage_editors`), `create_invitations` seeds it and `claim_invitations` writes it. The grant then opens nothing a user can reach:

- `ADMIN_GRANTS` in `roles.ts` is `(global, admin)`, `(account, admin)`, `(project, admin)`. The Admin App's login gate refuses a token that carries only `(project, editor)` with `403 grantNotAllowed`.
- `CONTESTANT_GRANTS` is the two entity-editor shapes, so the Contestant App's login gate refuses the same token.
- A returning user who arrives by a mailed link is not gated by the callback and lands on the Contestant App root, where the "nothing to edit" view is shown. The E2E project `invitation-landing` asserts exactly that, and asserts that a claimed `(project, admin)` promise opens the Admin App's login in the request that claimed it.

In the database a project editor holds real permissions (`project.edit_entities`, `entity.confirm`, `project.edit_questions` and the rest of the matrix's ProjectEditor column). The gap is the app-entry gate only.

## Solution

For the phase that builds the Admin App's screens for project editors:

- Decide whether a project editor enters the Admin App. If yes, add `{ scope: 'project', role: 'editor' }` to `ADMIN_GRANTS` and make each admin page ask the database (`user_can`) for what it shows, since the entry gate is not the authorisation boundary.
- If no, stop the model from promising a grant that leads nowhere: either refuse the shape in the authority map or say in the seeding screen that the role has no application yet.
- Related and still open: `2026-10-02-admin-with-candidate-grant-locked-out-of-admin-app.md` (a user who holds both an admin and a candidate grant).
