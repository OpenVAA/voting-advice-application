/**
 * perm-header-show-help data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-header-help-'.
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-header-help-';

teardown('delete perm-header-show-help dataset', async () => {
  const client = new SupabaseAdminClient();
  await runTeardownAsserted(PREFIX, client);
});
