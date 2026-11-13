/**
 * perm-question-video data-setup project.
 *
 * Invokes setupFromTemplate('perm-question-video') then mints a per-perm Playwright storage-state JSON via real `forceRegister` + a real sign-in on the contestant app's sign-in screen (synthetic tokens fail server-side JWT validation).
 *
 * The spec consumes the storage state for the candidate `hideVideo` slice (navigate to /en/contestant/questions/[questionId] as an authenticated candidate and assert the question video shows with hideVideo=false, then is suppressed after re-seeding hideVideo=true). The voter slice runs unauthenticated.
 *
 * Prefix: 'e2e-perm-qvid-' (matches the template's `const P` in `perm-question-video.ts`).
 */

import { expect, test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { createContestantLoginPage } from '../../fixtures/contestant/contestantLoginPage.fixture';
import { TIMEOUTS } from '../../helpers';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { TEST_CANDIDATE_PASSWORD } from '../../utils/testCredentials';
import { TESTS_DIR } from '../../utils/testsDir';
import { setupFromTemplate } from '../shared/setupFromTemplate';

const PREFIX = 'e2e-perm-qvid-';
export const STORAGE_STATE_PATH = path.join(TESTS_DIR, '../playwright/.auth/perm-question-video.json');

setup('import perm-question-video dataset + mint candidate session', async ({ page }) => {
  setup.setTimeout(TIMEOUTS.testMax);

  await setupFromTemplate('perm-question-video', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });

  const fullExternalId = `${PREFIX}ca-1-1a`;
  const candidateEmail = `${fullExternalId}@test.openvaa.local`;
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(candidateEmail);
  await client.forceRegister(fullExternalId, candidateEmail, TEST_CANDIDATE_PASSWORD);

  fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });
  await createContestantLoginPage(page).signInFromCold(candidateEmail, TEST_CANDIDATE_PASSWORD);
  await expect(page).not.toHaveURL(/.*login.*/);
  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
