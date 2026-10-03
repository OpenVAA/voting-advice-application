/**
 * perm-disable-election-2co data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-disable-elec-2co-'.
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-disable-elec-2co-';

teardown('delete perm-disable-election-2co dataset', async () => {
  const client = new SupabaseAdminClient();
  await runTeardownAsserted(PREFIX, client);
});
