---
created: 2026-10-09T00:00:00.000Z
title: A project editor can lock and unlock nominations — a consequence of the lock being an app setting
area: Supabase / authority; Admin app
severity: minor
source: Phase 175 plan 02 (operator decision OD08-B2 (a); 175-CONTEXT.md cross-phase obligation O-8); filed by 175-13
owner: the Admin-app work (the settings editor), with the operator's ruling on who should hold the lock
files:
  - apps/supabase/supabase/schema/301-auth-functions.sql
  - apps/supabase/supabase/schema/302-rls.sql
  - apps/supabase/supabase/schema/106-app-settings.sql
  - apps/supabase/supabase/tests/database/22-content-policies.test.sql
  - apps/supabase/supabase/tests/database/23-nominations-write.test.sql
---

## Finding

Since Phase 175 plan 02 the nominations lock is the app setting `access.nominationsLocked`, stored in the project's row of `public.app_settings`. `private.project_nominations_locked(project_id)` reads it, and the three policies for an entity's own users ask it: `entity_insert_nominations`, `entity_insert_parent_nominations` and `entity_update_nominations`.

The settings row is written under `project.edit_app_settings`. In `public.grant_role_permissions` that member is held by the global admin, the account admin, the project admin **and the project editor**. So a project editor can lock and unlock nominations for a whole project. Before the move the lock was a column of `projects`, written under `project.edit_project_settings`, which a project editor does not hold.

This was decided, not overlooked (OD08-B2 (a)): it is recorded here so that the Admin-app work meets it knowingly.

### What is measured and what is inferred

- Measured: the four role blocks that hold `project.edit_app_settings` (`301-auth-functions.sql`; the matrix row in `.claude/skills/database/rls-policy-map.md`); the pgTAP cells of `22-content-policies.test.sql` that show who may write the key and of `23-nominations-write.test.sql` that show the entity policies refused while it is on (the estate is 41 files, 1888 assertions, green on a freshly reset database at the phase's close).
- Measured: the admin nomination policies ask `project.edit_nominations` and do not ask the lock, so the lock never binds an admin's or a project editor's own writes.
- Inferred: that a deployment wants a narrower holder. Nothing is deployed, and no Admin-app editor for app settings exists (`2026-10-02-app-settings-shallow-merge-and-no-admin-editor.md` § 2), so today the key is written in Supabase Studio or by an import.

## Options

1. **Leave it.** A project editor already holds `project.edit_nominations` and can rewrite any nomination; holding the lock adds little authority.
2. **Guard the one key.** A trigger on `app_settings` that refuses a change of `access.nominationsLocked` by a caller who lacks `project.edit_project_settings`. It needs the OLD and the NEW row, so it is a trigger and not a policy, as `enforce_entity_immutability` is.
3. **Decide it in the Admin app alone.** The settings editor shows the lock only to a project admin. The database would still accept the write from a project editor.

Whichever is taken, the Admin app's settings editor is where the lock gets its first user interface, and the docs' sentence on who sets it (`apps/docs/src/routes/(content)/developers-guide/configuration/app-settings/+page.md` § The nominations lock) follows the ruling.
