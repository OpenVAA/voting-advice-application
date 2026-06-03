/**
 * perm-disable-candidate-app data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-nocand-' (matches the template's own externalIdPrefix).
 */

import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

const PREFIX = 'e2e-perm-nocand-';

teardown('delete perm-disable-candidate-app dataset', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
