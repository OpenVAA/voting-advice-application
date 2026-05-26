/**
 * perm-disable-election-2co data-teardown project — Phase 88 Plan 03.
 *
 * Scoped to PREFIX='test-perm-disable-elec-2co-' per 88-03-SCOPE.md:104-110.
 */

import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

const PREFIX = 'e2e-perm-disable-elec-2co-';

teardown('delete perm-disable-election-2co dataset', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
