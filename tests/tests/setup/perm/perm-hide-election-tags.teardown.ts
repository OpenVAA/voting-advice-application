/**
 * perm-hide-election-tags data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-hide-eltags-'.
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-hide-eltags-';

teardown('delete perm-hide-election-tags dataset', async () => {
  const client = new SupabaseAdminClient();
  await runTeardownAsserted(PREFIX, client);
});
