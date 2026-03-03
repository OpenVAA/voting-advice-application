import { expect,test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildRoute } from '../utils/buildRoute';
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
  // Ensure the auth directory exists
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Navigate to candidate app home (which redirects to login for unauthenticated users)
  const candidateHome = buildRoute({ route: 'CandAppHome', locale: 'en' });
  await page.goto(candidateHome);

  // Fill in login credentials using testId constants
  await page.getByTestId(testIds.candidate.login.email).fill('mock.candidate.2@openvaa.org');
  await page.getByTestId(testIds.candidate.login.password).fill('Password1!');
  await page.getByTestId(testIds.candidate.login.submit).click();

  // Wait for navigation away from the login page
  await expect(page).not.toHaveURL(/.*login.*/);

  // Save authenticated state for downstream tests
  await page.context().storageState({ path: authFile });
});
