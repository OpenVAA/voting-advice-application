/**
 * perm-show-feedback-survey data-teardown project.
 *
 * Scoped to PREFIX='e2e-perm-feedback-survey-' — the externalIdPrefix the
 * show-feedback-survey template actually seeds (show-feedback-survey.ts:36).
 * (The pre-rename teardown scoped to the never-seeded 'e2e-perm-header-feedback-'
 * prefix; the broad 'e2e-perm-' extraTeardownPrefix tag still swept the rows, but
 * the specific prefix is now aligned to the template — see phase 120.)
 */

import { test as teardown } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { runTeardownAsserted } from '../shared/assertTeardown';

const PREFIX = 'e2e-perm-feedback-survey-';

teardown('delete show-feedback-survey dataset', async () => {
  const client = new SupabaseAdminClient();
  await runTeardownAsserted(PREFIX, client);
});
