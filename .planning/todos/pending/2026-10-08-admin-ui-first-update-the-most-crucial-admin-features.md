---
created: 2026-10-08T00:00:00.000Z
title: Admin UI, first update — the most crucial features for admins (questions and categories, contestant-user fixes, app settings, translation overrides)
area: admin app
severity: major
source: operator, 2026-10-08 (captured during the v2.16 run)
owner: the operator, when the admin app is next scoped
files:
  - apps/frontend/src/routes/admin/
  - apps/frontend/src/lib/server/admin/
---

## Problem

An admin has no screen in the Admin app for the tasks that come up most often when a VAA is being run. They are
done through the Supabase dashboard, by import, or not at all. Several rules built in v2.16 assume an admin can
act — a confirmed entity's name is read-only to its user "and only an admin changes it"; a user whose nominations
are locked is sent to support — and the admin has no place in the app to do so.

## Solution

A first update of the Admin UI that implements the most crucial features. The operator's list:

- **Edit questions and categories.**
- **Fix common contestant-user issues** — some of them may defer to the Supabase dashboard:
  - alter a name;
  - change nominations;
  - maybe: let an admin use the Contestant app as that user.
- **Change app settings.**
- **Change translation overrides.**

Not decided here: which of the contestant-user fixes get a screen and which are a documented dashboard procedure;
whether "use the Contestant app as that user" is built at all, and by what mechanism; whether this is a phase of a
milestone or a milestone of its own.

## Standing todos this would absorb or touch

- `2026-10-02-app-settings-shallow-merge-and-no-admin-editor.md` (the app-settings editor)
- `2026-10-06-172-admin-confirm-requires-editor-acceptance.md` (confirming an entity whose editors have not accepted
  the terms of use)
- `2026-10-07-174-admin-grants-admit-no-project-editor.md`
- `2026-10-02-admin-with-candidate-grant-locked-out-of-admin-app.md`
- `2026-08-28-admin-login-supabase-independence.md`
- `2026-05-11-e2e-01-single-locale-runtime-override.md` (runtime translation overrides)
- Phase 999.1 in the roadmap's backlog (the command registry), which names admin actions as one of its consumers
