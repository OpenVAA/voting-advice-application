/**
 * perm-analytics-tracking data-teardown project (EFLOW-08, D-01).
 *
 * Scoped to PREFIX='e2e-perm-analytics-' (matches the template's own
 * externalIdPrefix, perm-analytics-tracking.ts). Bare seed-only teardown — no
 * candidate auth user to unregister (the voter slice is unauthenticated).
 */

import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

const PREFIX = 'e2e-perm-analytics-';

teardown('delete perm-analytics-tracking dataset', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
