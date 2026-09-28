/**
 * perm-org-matching data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-orgmatch-' (matches the template's own externalIdPrefix, perm-org-matching.ts:45). Bare seed-only teardown — no candidate auth user to unregister (the voter slice is unauthenticated).
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-orgmatch-';

teardown('delete perm-org-matching dataset', async () => {
  const client = new SupabaseAdminClient();
  await runTeardownAsserted(PREFIX, client);
});
