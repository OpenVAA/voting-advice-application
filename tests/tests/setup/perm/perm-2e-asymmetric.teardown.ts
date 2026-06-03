/**
 * perm-2e-asymmetric data-teardown project — Phase 88 Plan 03.
 *
 * Scoped to PREFIX='test-perm-2e-asymmetric-' per 88-03-SCOPE.md:104-110.
 */

import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

const PREFIX = 'e2e-perm-2e-asymmetric-';

teardown('delete perm-2e-asymmetric dataset', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
