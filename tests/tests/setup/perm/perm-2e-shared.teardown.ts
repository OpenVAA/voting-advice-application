/**
 * perm-2e-shared data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-2e-shared-'.
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-2e-shared-';

teardown('delete perm-2e-shared dataset', async () => {
  const client = new SupabaseAdminClient();
  await runTeardownAsserted(PREFIX, client);
});
