/**
 * perm-missing-nominations data-teardown project — Phase 90 Plan 02 (TIR5:15-26).
 *
 * Scoped to PREFIX='e2e-perm-missnoms-' per D-90-01 (matches the template's
 * own externalIdPrefix).
 */

import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

const PREFIX = 'e2e-perm-missnoms-';

teardown('delete perm-missing-nominations dataset', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
