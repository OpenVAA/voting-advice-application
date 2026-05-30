/**
 * perm-disable-allow-open data-setup project — Phase 91 Plan 02
 * (TIR6:121-142, A9). Mints a per-perm Playwright storage state via real
 * `forceRegister` + real UI login through the candidate-app login form
 * (D-91-PD-06 REVISED — CR-01 BLOCKER closure; synth tokens fail server-
 * side JWT validation). Consumed by the candidate-side describe block in
 * perm-disable-allow-open.spec.ts. The voter-side describe block does not
 * use storage state.
 *
 * Prefix: 'e2e-perm-no-allowopen-' per D-91-PD-05.
 */

import { expect, test as setup } from '@playwright/test';
import type { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { buildRoute } from '../utils/buildRoute';
import { SupabaseAdminClient } from '../utils/supabaseAdminClient';
import { TEST_CANDIDATE_PASSWORD } from '../utils/testCredentials';
import { testIds } from '../utils/testIds';
import { TESTS_DIR } from '../utils/testsDir';
import { setupFromTemplate } from './setupFromTemplate';

const PREFIX = 'e2e-perm-no-allowopen-';
export const STORAGE_STATE_PATH = path.join(
  TESTS_DIR,
  '../playwright/.auth/perm-disable-allow-open.json'
);

/**
 * Wait for the candidate-app login form to be visible, reloading up to
 * `maxAttempts - 1` times if the backend is cold-starting. Mirrors the
 * canonical helper in `auth.setup.ts:23-57`.
 */
async function waitForLoginForm(
  page: Page,
  loginRoute: string,
  emailTestId: string,
  maxAttempts = 3
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await page.goto(loginRoute, { waitUntil: 'domcontentloaded' });
    try {
      await page.getByTestId(emailTestId).waitFor({ state: 'visible', timeout: 10000 });
      return;
    } catch {
      if (attempt >= maxAttempts - 1) {
        throw new Error(
          `Login form did not appear after ${attempt + 1} attempts on ${loginRoute}.`
        );
      }
    }
  }
}

setup('import perm-disable-allow-open dataset + mint candidate session', async ({ page }) => {
  setup.setTimeout(90000);

  await setupFromTemplate('perm-disable-allow-open', {
    extraTeardownPrefix: ['test-', 'e2e-perm-']
  });

  const fullExternalId = `${PREFIX}cand-1`;
  const candidateEmail = `${fullExternalId}@test.openvaa.local`;
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(candidateEmail);
  await client.forceRegister(fullExternalId, candidateEmail, TEST_CANDIDATE_PASSWORD);

  fs.mkdirSync(path.dirname(STORAGE_STATE_PATH), { recursive: true });
  const candidateHome = buildRoute({ route: 'CandAppHome', locale: 'en' });
  await waitForLoginForm(page, candidateHome, testIds.candidate.login.email);
  await page.getByTestId(testIds.candidate.login.email).fill(candidateEmail);
  await page.getByTestId(testIds.candidate.login.password).fill(TEST_CANDIDATE_PASSWORD);
  await page.getByTestId(testIds.candidate.login.submit).click();
  await expect(page).not.toHaveURL(/.*login.*/);
  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
