/**
 * perm-localisation-negative data-teardown project — Phase 90 Plan 03 (TIR5:28-50).
 *
 * Scoped to PREFIX='e2e-perm-l10n-neg-' per D-90-01 (matches the template's
 * own externalIdPrefix).
 */

import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

const PREFIX = 'e2e-perm-l10n-neg-';

teardown('delete perm-localisation-negative dataset', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
