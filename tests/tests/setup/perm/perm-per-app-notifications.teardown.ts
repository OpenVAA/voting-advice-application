/**
 * perm-per-app-notifications data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-notif-' (matches the template's own externalIdPrefix).
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-notif-';

teardown('delete perm-per-app-notifications dataset', async () => {
  const client = new SupabaseAdminClient();
  await runTeardownAsserted(PREFIX, client);
});
