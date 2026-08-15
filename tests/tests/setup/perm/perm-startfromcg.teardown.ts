/**
 * perm-startfromcg data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-startfromcg-'.
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-startfromcg-';

teardown('delete perm-startfromcg dataset', async () => {
  const client = new SupabaseAdminClient();
  await runTeardownAsserted(PREFIX, client);
});
