/**
 * perm-hide-hero data-setup project.
 *
 * Invokes setupFromTemplate('perm-hide-hero') then mints a per-perm Playwright storage-state JSON via real `forceRegister` + a real sign-in on the contestant app's sign-in screen (synthetic tokens fail server-side JWT validation).
 *
 * The spec consumes the storage state to navigate to /en/contestant/questions/[questionId] as an authenticated candidate and assert hideHero=true suppresses hero rendering.
 *
 * Prefix: 'e2e-perm-hide-hero-'.
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

const PREFIX = 'e2e-perm-hide-hero-';
export const STORAGE_STATE_PATH = path.join(TESTS_DIR, '../playwright/.auth/perm-hide-hero.json');

setup('import perm-hide-hero dataset + mint candidate session', async ({ page }) => {
  setup.setTimeout(TIMEOUTS.testMax);

  await setupFromTemplate('perm-hide-hero', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });

  const fullExternalId = `${PREFIX}cand-1`;
  const candidateEmail = `${fullExternalId}@test.openvaa.local`;
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(candidateEmail);
  await client.forceRegister(fullExternalId, candidateEmail, TEST_CANDIDATE_PASSWORD);

  fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });
  await createContestantLoginPage(page).signInFromCold(candidateEmail, TEST_CANDIDATE_PASSWORD);
  await expect(page).not.toHaveURL(/.*login.*/);
  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
