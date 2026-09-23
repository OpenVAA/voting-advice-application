/**
 * perm-closed-project data-setup project — the TERMINAL node's setup (162.1 D-21).
 *
 * Invokes setupFromTemplate('perm-closed-project'). Prefix: 'e2e-perm-closed-project-'.
 *
 * The template's `openForVoters: false` makes the writer's last pass set `open_for_voters = false` on the E2E project, i.e. on the one project the dev server serves. That is why this setup's project runs after every leaf of the suite (see `CLOSED_PROJECT_DEPENDENCIES` in `tests/playwright.config.ts`): no other spec is running while the project is closed. Reopening is the job of the spec's `afterAll`, this node's teardown and the next run's global setup.
 *
 * It also provisions a real auth user for the seeded candidate (`forceRegister`, the perm-answers-locked pattern) so the spec can log in through the candidate form on the closed project (162.1 D-16). `terms_of_use_accepted` is set to a fixed past timestamp AFTER `forceRegister`, because `unregisterCandidate` clears it; with it set, the login lands on the candidate home rather than on the terms-of-use form.
 */

import { test as setup } from '@playwright/test';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { TEST_CANDIDATE_PASSWORD } from '../../utils/testCredentials';
import { setupFromTemplate } from '../shared/setupFromTemplate';

const PREFIX = 'e2e-perm-closed-project-';
const CANDIDATE_EXTERNAL_ID = `${PREFIX}cand-1`;
const CANDIDATE_EMAIL = `${CANDIDATE_EXTERNAL_ID}@test.openvaa.local`;

setup('import perm-closed-project dataset', async () => {
  await setupFromTemplate('perm-closed-project');

  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(CANDIDATE_EMAIL);
  await client.forceRegister(CANDIDATE_EXTERNAL_ID, CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD);

  const found = await client.findData('candidates', { external_id: { $eq: CANDIDATE_EXTERNAL_ID } });
  const rows = found.type === 'success' ? (found.data ?? []) : [];
  if (rows.length !== 1) {
    throw new Error(`perm-closed-project setup: expected exactly one candidate '${CANDIDATE_EXTERNAL_ID}'.`);
  }
  await client.update('candidates', String(rows[0].id), {
    terms_of_use_accepted: '2025-01-01T00:00:00.000Z'
  });
});
