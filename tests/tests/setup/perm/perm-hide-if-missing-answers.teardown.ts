/**
 * perm-hide-if-missing-answers data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-hide-missing-'.
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-hide-missing-';

teardown('delete perm-hide-if-missing-answers dataset', async () => {
  const client = new SupabaseAdminClient();
  await runTeardownAsserted(PREFIX, client);
});
