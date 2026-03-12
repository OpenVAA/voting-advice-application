import { test as base } from '@playwright/test';
import path from 'path';
import { buildRoute } from '../utils/buildRoute';
import { testIds } from '../utils/testIds';

/**
 * Auth fixture providing worker-scoped authentication state.
 *
 * This fixture is separate from auth.setup.ts (Plan 02). The setup project
 * provides auth for the candidate-app project via config-level storageState.
 * This fixture is for when tests need to re-authenticate within a worker
 * (e.g., after testing logout). Both approaches use the same credentials
 * and testIds.
 */
export const test = base.extend<object, { workerStorageState: string }>({
  // Use the same storage state for all tests in this worker
  workerStorageState: [
    async ({ browser }, use) => {
      // Use parallelIndex to create unique storage state per worker
      const id = test.info().parallelIndex;
      const fileName = path.resolve(test.info().project.outputDir, `.auth/user-${id}.json`);

      // Authenticate
      const page = await browser.newPage({ storageState: undefined });
      const baseURL = test.info().project.use.baseURL ?? 'http://localhost:5173';
      await page.goto(`${baseURL}/${buildRoute({ route: 'CandAppHome', locale: 'en' })}`);
      await page.getByTestId(testIds.candidate.login.email).fill('mock.candidate.2@openvaa.org');
      await page.getByTestId(testIds.candidate.login.password).fill('Password1!');
      await page.getByTestId(testIds.candidate.login.submit).click();
      await page.waitForURL(/.*(?!.*login).*/); // Wait for URL to not contain 'login'
      await page.context().storageState({ path: fileName });
      await page.close();

      await use(fileName);
    },
    { scope: 'worker' }
  ],

  // Override storageState to use the worker-scoped state
  storageState: ({ workerStorageState }, use) => use(workerStorageState)
});
