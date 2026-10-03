/**
 * perm-2e-asymmetric data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-2e-asymmetric-'.
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-2e-asymmetric-';

teardown('delete perm-2e-asymmetric dataset', async () => {
  const client = new SupabaseAdminClient();
  await runTeardownAsserted(PREFIX, client);
});
