/**
 * perm-question-video data-setup project.
 *
 * Invokes setupFromTemplate('perm-question-video') then mints a per-perm Playwright storage-state JSON via real `forceRegister` + real UI login through the candidate-app login form (synthetic tokens fail server-side JWT validation).
 *
 * The spec consumes the storage state for the candidate `hideVideo` slice (navigate to /en/candidate/questions/[questionId] as an authenticated candidate and assert the question video shows with hideVideo=false, then is suppressed after re-seeding hideVideo=true). The voter slice runs unauthenticated.
 *
 * Prefix: 'e2e-perm-qvid-' (matches `perm-question-video.ts:42` `const P`).
 */

import { expect, test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { buildRoute } from '../../utils/buildRoute';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { TEST_CANDIDATE_PASSWORD } from '../../utils/testCredentials';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';
import { setupFromTemplate } from '../shared/setupFromTemplate';
import type { Page } from '@playwright/test';

const PREFIX = 'e2e-perm-qvid-';
export const STORAGE_STATE_PATH = path.join(TESTS_DIR, '../playwright/.auth/perm-question-video.json');

/**
 * Wait for the candidate-app login form to be visible, reloading up to `maxAttempts - 1` times if the backend is cold-starting. Mirrors the canonical helper in `auth.setup.ts:23-57`.
 */
async function waitForLoginForm(page: Page, loginRoute: string, emailTestId: string, maxAttempts = 3): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await page.goto(loginRoute, { waitUntil: 'domcontentloaded' });
    try {
      await page.getByTestId(emailTestId).waitFor({ state: 'visible', timeout: 10000 });
      return;
    } catch {
      if (attempt >= maxAttempts - 1) {
        throw new Error(`Login form did not appear after ${attempt + 1} attempts on ${loginRoute}.`);
      }
    }
  }
}

setup('import perm-question-video dataset + mint candidate session', async ({ page }) => {
  setup.setTimeout(90000);

  await setupFromTemplate('perm-question-video', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });

  const fullExternalId = `${PREFIX}ca-1-1a`;
  const candidateEmail = `${fullExternalId}@test.openvaa.local`;
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(candidateEmail);
  await client.forceRegister(fullExternalId, candidateEmail, TEST_CANDIDATE_PASSWORD);

  fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });
  const candidateHome = buildRoute({ route: 'CandAppHome', locale: 'en' });
  await waitForLoginForm(page, candidateHome, testIds.candidate.login.email);
  await page.getByTestId(testIds.candidate.login.email).fill(candidateEmail);
  await page.getByTestId(testIds.candidate.password.field).fill(TEST_CANDIDATE_PASSWORD);
  await page.getByTestId(testIds.candidate.login.submit).click();
  await expect(page).not.toHaveURL(/.*login.*/);
  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
