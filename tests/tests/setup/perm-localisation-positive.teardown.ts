/**
 * perm-localisation-positive data-teardown project — Phase 90 Plan 04 (TIR5:52-95).
 *
 * Scoped to PREFIX='e2e-perm-l10n-pos-' per D-90-01 (matches the template's
 * own externalIdPrefix).
 */

import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';

const PREFIX = 'e2e-perm-l10n-pos-';

teardown('delete perm-localisation-positive dataset', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
