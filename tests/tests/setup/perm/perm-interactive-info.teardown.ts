/**
 * perm-interactive-info data-teardown project (EPERM-07).
 *
 * Scoped to PREFIX='e2e-perm-iinfo-' (matches the template's own externalIdPrefix,
 * perm-interactive-info.ts:46). Bare seed-only teardown — no candidate auth user
 * to unregister (the voter slice is unauthenticated).
 */

import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

const PREFIX = 'e2e-perm-iinfo-';

teardown('delete perm-interactive-info dataset', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
