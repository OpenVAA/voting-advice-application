/**
 * perm-not-located-2e2cg data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-notloc-'.
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-notloc-';

teardown('delete perm-not-located-2e2cg dataset', async () => {
  const client = new SupabaseAdminClient();
  await runTeardownAsserted(PREFIX, client);
});
