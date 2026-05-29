/**
 * perm-per-app-notifications data-teardown project — Phase 89 Plan 04.
 *
 * Scoped to PREFIX='e2e-perm-notif-' per D-89-03 (matches the template's
 * own externalIdPrefix).
 */

import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

const PREFIX = 'e2e-perm-notif-';

teardown('delete perm-per-app-notifications dataset', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
