import { expect, test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildRoute } from '../utils/buildRoute';
import { TEST_CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD } from '../utils/testCredentials';
import { testIds } from '../utils/testIds';
import type { Page } from '@playwright/test';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(currentDir, '../../playwright/.auth/user.json');

/**
 * Wait for the candidate-app login form to be visible, reloading up to
 * `maxAttempts - 1` times if the backend is cold-starting.
 *
 * Module-level helper hoisted out of the setup body (RESEARCH Pattern 4
 * canonical 3) so playwright/no-conditional-in-test holds for the setup
 * callback itself. The `attempt < maxAttempts - 1` branch is a legitimate
 * retry-vs-fail dispatch on settled state (the previous waitFor already
 * timed out before we reach the branch) — not a race-mask.
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
      await page.getByTestId(emailTestId).waitFor({ state: 'visible', timeout: 20000 });
      return; // Login form appeared
    } catch {
      if (attempt < maxAttempts - 1) {
        // Reload and retry
        await page.reload({ waitUntil: 'domcontentloaded' });
      } else {
        // Final attempt failed
        throw new Error(
          `Login form did not appear after ${attempt + 1} attempts. ` +
            'The candidate app may be stuck on the loading screen due to the backend being unresponsive.'
        );
      }
    }
  }
}

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

  // Ensure the auth directory exists. `recursive: true` is idempotent: it
  // does NOT throw if the directory already exists (Node fs docs), so the
  // prior `if (!existsSync) mkdirSync` conditional is redundant. Replacing
  // with the unconditional mkdir clears playwright/no-conditional-in-test
  // without changing semantics.
  const authDir = path.dirname(authFile);
  fs.mkdirSync(authDir, { recursive: true });

  // Navigate to candidate app home (which redirects to login for unauthenticated users).
  // The candidate app loads through the root layout which fetches data promises
  // and shows <Loading> until they resolve. The backend can be slow to respond,
  // especially when running parallel with voter tests.
  //
  // The retry-with-reload loop is hoisted to `waitForLoginForm` (module-level)
  // so the setup body stays conditional-free (RESEARCH Pattern 4 canonical 3).
  const candidateHome = buildRoute({ route: 'CandAppHome', locale: 'en' });
  await waitForLoginForm(page, candidateHome, testIds.candidate.login.email);

  // Login credentials matching data.setup.ts (Test Candidate Alpha from default dataset)
  await page.getByTestId(testIds.candidate.login.email).fill(TEST_CANDIDATE_EMAIL);
  await page.getByTestId(testIds.candidate.login.password).fill(TEST_CANDIDATE_PASSWORD);
  await page.getByTestId(testIds.candidate.login.submit).click();

  // Wait for navigation away from the login page
  await expect(page).not.toHaveURL(/.*login.*/);

  // Save authenticated state for downstream tests
  await page.context().storageState({ path: authFile });
});
