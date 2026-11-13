/**
 * perm-analytics-tracking data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-analytics-' (matches the template's own externalIdPrefix, perm-analytics-tracking.ts).
 *
 * Before the prefix delete it unregisters the two auth users the terms-tracking spec registers on the dataset's member candidates (`ANALYTICS_TERMS_GRANTING_EMAIL` and `ANALYTICS_TERMS_REFUSING_EMAIL`), with their grants and terms-of-use acceptances, and asserts that no auth user holds either address afterwards: `runTeardown(PREFIX)` deletes the candidate rows but not the auth users, and a user left behind would collide as "already registered" on the next run. It also removes the two stored sessions. The stand-alone teardown project `data-teardown-analytics-standalone` runs this same file.
 *
 * Idempotent: `unregisterCandidate` is a no-op when no auth user holds the address, as when the spec did not run.
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-analytics-';

teardown('delete perm-analytics-tracking dataset', async () => {
  const client = new SupabaseAdminClient();
  await runTeardownAsserted(PREFIX, client);
});
