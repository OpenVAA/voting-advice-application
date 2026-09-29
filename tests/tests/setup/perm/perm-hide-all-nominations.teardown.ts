/**
 * perm-hide-all-nominations data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-hide-all-noms-'.
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-hide-all-noms-';

teardown('delete perm-hide-all-nominations dataset', async () => {
  const client = new SupabaseAdminClient();
  await runTeardownAsserted(PREFIX, client);
});
