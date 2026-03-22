import { expect, test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildRoute } from '../utils/buildRoute';
import { testIds } from '../utils/testIds';
import { TEST_CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD } from '../utils/testCredentials';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(currentDir, '../../playwright/.auth/user.json');

/**
 * Re-auth setup project: re-authenticates the alpha candidate after mutation
 * tests have invalidated the original storageState (via admin setPassword
 * which revokes refresh tokens).
 *
 * Depends on candidate-app-mutation. Writes a fresh storageState file
 * for downstream projects (candidate-app-password, candidate-app-settings).
 */
setup('re-authenticate as candidate', async ({ page }) => {
  // Ensure the auth directory exists
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Navigate to candidate login
  const candidateHome = buildRoute({ route: 'CandAppHome', locale: 'en' });
  await page.goto(candidateHome);

  // Fill in login credentials
  await page.getByTestId(testIds.candidate.login.email).fill(TEST_CANDIDATE_EMAIL);
  await page.getByTestId(testIds.candidate.login.password).fill(TEST_CANDIDATE_PASSWORD);
  await page.getByTestId(testIds.candidate.login.submit).click();

  // Wait for navigation away from login
  await expect(page).not.toHaveURL(/.*login.*/);

  // Save fresh authenticated state
  await page.context().storageState({ path: authFile });
});
