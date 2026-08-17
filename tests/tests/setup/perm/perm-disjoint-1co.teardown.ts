/**
 * perm-disjoint-1co data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-disjoint-1co-'.
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-disjoint-1co-';

teardown('delete perm-disjoint-1co dataset', async () => {
  const client = new SupabaseAdminClient();
  await runTeardownAsserted(PREFIX, client);
});
