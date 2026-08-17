/**
 * perm-analytics-tracking data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-analytics-' (matches the template's own
 * externalIdPrefix, perm-analytics-tracking.ts). Bare seed-only teardown — no
 * candidate auth user to unregister (the voter slice is unauthenticated).
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-analytics-';

teardown('delete perm-analytics-tracking dataset', async () => {
  const client = new SupabaseAdminClient();
  await runTeardownAsserted(PREFIX, client);
});
