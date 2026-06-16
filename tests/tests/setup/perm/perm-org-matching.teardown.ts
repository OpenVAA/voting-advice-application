/**
 * perm-org-matching data-teardown project (EPERM-10).
 *
 * Scoped to PREFIX='e2e-perm-orgmatch-' (matches the template's own
 * externalIdPrefix, perm-org-matching.ts:45). Bare seed-only teardown — no
 * candidate auth user to unregister (the voter slice is unauthenticated).
 */

import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

const PREFIX = 'e2e-perm-orgmatch-';

teardown('delete perm-org-matching dataset', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
