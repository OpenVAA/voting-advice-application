/**
 * perm-hide-all-nominations data-teardown project — Phase 91 Plan 02
 * (TIR6:90-93).
 *
 * Scoped to PREFIX='e2e-perm-hide-all-noms-' per D-91-PD-05.
 */

import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

const PREFIX = 'e2e-perm-hide-all-noms-';

teardown('delete perm-hide-all-nominations dataset', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
