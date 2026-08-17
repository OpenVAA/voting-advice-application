/**
 * perm-interactive-info data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-iinfo-' (matches the template's own externalIdPrefix,
 * perm-interactive-info.ts:46). Bare seed-only teardown — no candidate auth user
 * to unregister (the voter slice is unauthenticated).
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-iinfo-';

teardown('delete perm-interactive-info dataset', async () => {
  const client = new SupabaseAdminClient();
  await runTeardownAsserted(PREFIX, client);
});
