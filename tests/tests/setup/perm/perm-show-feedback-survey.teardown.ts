/**
 * perm-show-feedback-survey data-teardown project (EPERM-09).
 *
 * Scoped to PREFIX='e2e-perm-feedback-survey-' — the externalIdPrefix the
 * show-feedback-survey template actually seeds (show-feedback-survey.ts:36).
 * (The pre-rename teardown scoped to the never-seeded 'e2e-perm-header-feedback-'
 * prefix; the broad 'e2e-perm-' extraTeardownPrefix tag still swept the rows, but
 * the specific prefix is now aligned to the template — Phase 120-07.)
 */

import { runTeardown } from '@openvaa/dev-seed';
import { expect, test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';

const PREFIX = 'e2e-perm-feedback-survey-';

teardown('delete show-feedback-survey dataset', async () => {
  const client = new SupabaseAdminClient();
  const { rowsDeleted } = await runTeardown(PREFIX, client);
  expect(rowsDeleted, 'runTeardown returned non-numeric rowsDeleted').toBeGreaterThanOrEqual(0);
});
