/**
 * perm-hide-category-tags data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-hide-cattags-'.
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-hide-cattags-';

teardown('delete perm-hide-category-tags dataset', async () => {
  const client = new SupabaseAdminClient();
  await runTeardownAsserted(PREFIX, client);
});
