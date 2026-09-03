/**
 * perm-missing-nominations data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-missnoms-' (matches the template's own externalIdPrefix).
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-missnoms-';

teardown('delete perm-missing-nominations dataset', async () => {
  const client = new SupabaseAdminClient();
  await runTeardownAsserted(PREFIX, client);
});
