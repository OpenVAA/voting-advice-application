import { expect, test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildRoute } from '../utils/buildRoute';
import { TEST_CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD } from '../utils/testCredentials';
import { testIds } from '../utils/testIds';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(currentDir, '../../playwright/.auth/user.json');

/**
 * Auth setup project: authenticates as a candidate and saves storageState.
 *
 * Depends on data-setup (the candidate must exist in the database).
 * Uses mock.candidate.2@openvaa.org which corresponds to Test Candidate Alpha
 * in the default dataset.
 */
setup('authenticate as candidate', async ({ page }) => {
  // Candidate app data loading can be slow; increase timeout
  setup.setTimeout(90000);

  // Ensure the auth directory exists
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Navigate to candidate app home (which redirects to login for unauthenticated users).
  // The candidate app loads through the root layout which fetches data promises
  // and shows <Loading> until they resolve. Strapi can be slow to respond,
  // especially when running parallel with voter tests.
  const candidateHome = buildRoute({ route: 'CandAppHome', locale: 'en' });

  // Try navigating with a retry: if the login form doesn't appear within 30s,
  // reload the page once (Strapi may have been cold-starting or rate-limited).
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.goto(candidateHome, { waitUntil: 'domcontentloaded' });

    try {
      await page.getByTestId(testIds.candidate.login.email).waitFor({ state: 'visible', timeout: 20000 });
      break; // Login form appeared
    } catch {
      if (attempt < 2) {
        // Reload and retry
        await page.reload({ waitUntil: 'domcontentloaded' });
      } else {
        // Final attempt failed
        throw new Error(
          `Login form did not appear after ${attempt + 1} attempts. ` +
            `The candidate app may be stuck on the loading screen due to Strapi being unresponsive.`
        );
      }
    }
  }

  // Login credentials matching data.setup.ts (Test Candidate Alpha from default dataset)
  await page.getByTestId(testIds.candidate.login.email).fill(TEST_CANDIDATE_EMAIL);
  await page.getByTestId(testIds.candidate.login.password).fill(TEST_CANDIDATE_PASSWORD);
  await page.getByTestId(testIds.candidate.login.submit).click();

  // Wait for navigation away from the login page
  await expect(page).not.toHaveURL(/.*login.*/);

  // Save authenticated state for downstream tests
  await page.context().storageState({ path: authFile });
});
