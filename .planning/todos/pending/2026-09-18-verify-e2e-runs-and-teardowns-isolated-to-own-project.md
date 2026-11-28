---
created: "2026-09-18T12:00:00.000Z"
title: Verify E2E runs and their teardowns are isolated to the suite's own project under the project_id model
area: testing
severity: major
source: operator instruction 2026-09-18 (/gsd-capture), during Phase 162.1 planning
files:
  - tests/global-setup.ts
  - tests/playwright.config.ts
  - tests/tests/setup/shared/setupFromTemplate.ts
  - tests/tests/setup/candidate/candidate-journey.teardown.ts
  - tests/tests/setup/candidate/bank-auth-journey.teardown.ts
  - packages/dev-seed/src/cli/teardown.ts
  - packages/dev-seed/src/supabaseAdminClient.ts
  - apps/supabase/supabase/schema/501-bulk-operations.sql
related:
  - .planning/todos/pending/2026-08-23-test-unit-leaves-seeded-dataset-in-live-db.md
---

## Problem

Every query the application issues is now scoped to one `PUBLIC_PROJECT_ID`, and the E2E suite creates and
owns its own project (`tests/global-setup.ts` → `SupabaseAdminClient().ensureProject()`). CLAUDE.md claims
that clearing the database is therefore not a precondition of a run. **Nobody has verified that claim end to
end**: that everything an E2E run *creates, mutates and deletes* stays inside the suite's project, so a run can
never touch a developer's data in another project, and a developer's data can never change an E2E result.

Places where isolation can plausibly leak (unverified, to check one by one):

1. **Teardown selects rows by `external_id` prefix** (`packages/dev-seed/src/cli/teardown.ts` → the `bulk_delete`
   RPC in `501-bulk-operations.sql`). Is the delete also filtered by `project_id`, or would the same prefix in
   another project be deleted too?
2. **Auth users are global, not per project.** Candidate/bank-auth teardowns unregister invited users. Could a
   teardown remove a user who also holds grants in another project, and could a leftover user with the same
   email in another project break a run?
3. **`app_settings`**: `setupFromTemplate.ts` and `supabaseAdminClient.ts` comments still describe "a SINGLE
   `app_settings` row that every perm setup mutates". Confirm that under the project model the suite only
   replaces its own project's row, and update those comments if they are stale.
4. **Storage**: portrait cleanup enumerates `${projectId}/candidates/`. Confirm the prefix is always the
   suite's project, and note Phase 162.1's storage-cleanup fix (spike 029, F4) changes what cleanup actually
   deletes.
5. **Project-level state**: Phase 162.1's closed-project spec flips `open_for_voters` on the suite's served
   project. Check that nothing else (grants, `lock_nominations`, account rows) is mutated project-wide and
   left behind.
6. **The reverse direction**: developer data in the default project (`…0001`, e.g. the `seed_` default template
   left by `yarn test:unit`, see the related todo) must not change any E2E assertion.

## Solution

TBD. Suggested shape:

- Take a census of every table (row counts per `project_id`, plus `auth.users` and `storage.objects` per
  folder) **before** a full `tests/scripts/e2e-run.sh` run, with a deliberately populated second project
  (the `default` template) present.
- Run the suite; take the census again. The only allowed differences are inside the suite's project id (and
  auth users the suite created and removed). Anything else is a leak: fix it at its source.
- Run the suite **twice** against that populated database, and once with the second project's data using the
  **same** `external_id` prefix the suite uses, to prove prefix collisions cannot cross projects.
- Turn the census diff into a permanent check (a global-teardown assertion or a pgTAP/CI step), so isolation
  stays proven rather than assumed.
