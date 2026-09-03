import { test as teardown } from '@playwright/test';
import fs from 'fs';
import { ADMIN_STORAGE_STATE, TEST_ADMIN_EMAIL } from '../../utils/adminCredentials';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

/**
 * admin-access data-teardown project.
 *
 * DELIBERATELY NOT WIRED INTO the shared prefix-counting teardown helper (`setup/shared/assertTeardown.ts`). That helper owns the before/after delete-count assertion, and its whole contract is that the calling project owns an `external_id` prefix no other project can touch. This project owns NO prefixed rows — it owns one auth account, its role rows, and the `admin_jobs` rows the spec caused — so joining the counting machinery would mean claiming a prefix it does not own and racing the projects that do.
 *
 * Two removals, and the second is the one nothing else in the suite can perform:
 *
 * 1. `unregisterCandidate(TEST_ADMIN_EMAIL)` — deletes the `user_roles` rows by `user_id` and the `auth.users` account. Its candidate-row update is a harmless no-op here (no row carries this account's `auth_user_id`). Idempotent: a no-op when no account matches, so it is safe after a partial spec failure.
 * 2. `deleteAdminJobsByAuthor(TEST_ADMIN_EMAIL)` — the `admin_jobs` rows the spec's failure-path submission wrote. `admin_jobs` is not in `ALLOWED_TEARDOWN_TABLES`, carries no `external_id`, has `election_id ON DELETE SET NULL` rather than a cascade, and cascades from `project_id` only off a `projects` row the seed bootstraps and nothing deletes. Without this line those rows accumulate across every run, forever.
 *
 * ORDER: jobs first, then the account. `admin_jobs.author` is a plain text column with no foreign key to `auth.users`, so the order is not enforced by the schema — it is chosen so that a failure in the account delete still leaves the job rows gone rather than orphaned behind a missing identity.
 *
 * The stored session file is removed last. It is a credential on disk with no owner once the account is gone, and leaving it invites a later run to load a session for a user that no longer exists — which presents as a login page, not as an error.
 */
teardown('remove the admin identity and the job rows it caused', async () => {
  const client = new SupabaseAdminClient();
  await client.deleteAdminJobsByAuthor(TEST_ADMIN_EMAIL);
  await client.unregisterCandidate(TEST_ADMIN_EMAIL);
  fs.rmSync(ADMIN_STORAGE_STATE, { force: true });
});
