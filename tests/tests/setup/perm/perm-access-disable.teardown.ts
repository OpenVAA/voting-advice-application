/**
 * perm-access-disable data-teardown project (consolidated).
 *
 * Scoped to PREFIX='e2e-perm-access-disable-' (matches the template's own externalIdPrefix).
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-access-disable-';

teardown('delete perm-access-disable dataset', async () => {
  const client = new SupabaseAdminClient();
  await runTeardownAsserted(PREFIX, client);
});
