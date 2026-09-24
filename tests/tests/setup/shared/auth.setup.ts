import { expect, test as setup } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildRoute } from '../../utils/buildRoute';
import { SupabaseAdminClient } from '../../utils/supabaseAdminClient';
import { TEST_CANDIDATE_EMAIL, TEST_CANDIDATE_EXTERNAL_ID, TEST_CANDIDATE_PASSWORD } from '../../utils/testCredentials';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const authFile = path.join(currentDir, '../../../playwright/.auth/user.json');

/**
 * Wait for the candidate-app login form to be visible, reloading up to `maxAttempts - 1` times if the backend is cold-starting.
 *
 * Module-level helper hoisted out of the setup body so playwright/no-conditional-in-test holds for the setup callback itself. The `attempt < maxAttempts - 1` branch is a legitimate retry-vs-fail dispatch on settled state (the previous waitFor already timed out before we reach the branch) — not a race-mask.
 */
async function waitForLoginForm(page: Page, loginRoute: string, emailTestId: string, maxAttempts = 3): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await page.goto(loginRoute, { waitUntil: 'domcontentloaded' });

    try {
      await page.getByTestId(emailTestId).waitFor({ state: 'visible', timeout: 10000 });
      return; // Login form appeared
    } catch {
      if (attempt < maxAttempts - 1) {
        // reason: no `page.reload(...)` here — the next loop iteration starts
        //   with another `page.goto(loginRoute, ...)` which fully replaces the page state, so reloading first would add an extra network round-trip without observable effect. Fall through to the next iteration's goto() instead.
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
 * Auth setup project: registers a base-dataset candidate and saves storageState.
 *
 * Depends on `data-setup-base` (the candidate row must exist in the database before it can be force-registered).
 *
 * The `candidates` table carries NO email column, so the base seed cannot ship a
 * *registered* candidate — registration is a runtime act. This setup therefore mints the auth user itself via `SupabaseAdminClient.forceRegister`, exactly as every perm-* setup does, then logs in through the real candidate-app login form (synthetic tokens fail server-side `safeGetSession()` JWT validation, so only a real Supabase-minted session survives the protected candidate layout).
 *
 * The `unregisterCandidate` call ahead of `forceRegister` makes re-runs idempotent: a prior run's auth user would otherwise collide as "User already exists". It is safe with respect to `terms_of_use_accepted` because `data-setup-base` has just re-inserted the candidate row with `auth_user_id` NULL, so the stale auth user matches no row and only the orphan auth.users record is removed.
 */
setup('register + authenticate as base candidate', async ({ page }) => {
  // Candidate app data loading can be slow; increase timeout
  setup.setTimeout(90000);

  // Ensure the auth directory exists. `recursive: true` is idempotent: it does NOT throw if the directory already exists (Node fs docs), so the prior `if (!existsSync) mkdirSync` conditional is redundant. Replacing with the unconditional mkdir clears playwright/no-conditional-in-test without changing semantics.
  const authDir = path.dirname(authFile);
  fs.mkdirSync(authDir, { recursive: true });

  // Register the base candidate (mirrors the perm-* setups' forceRegister mechanism rather than inventing a second one).
  const client = new SupabaseAdminClient();
  await client.unregisterCandidate(TEST_CANDIDATE_EMAIL);
  await client.forceRegister(TEST_CANDIDATE_EXTERNAL_ID, TEST_CANDIDATE_EMAIL, TEST_CANDIDATE_PASSWORD);

  // Navigate to candidate app home (which redirects to login for unauthenticated users).
  // The candidate app loads through the root layout which fetches data promises and shows <Loading> until they resolve. The backend can be slow to respond, especially when running parallel with voter tests.
  //
  // The retry-with-reload loop is hoisted to `waitForLoginForm` (module-level) so the setup body stays conditional-free.
  const candidateHome = buildRoute({ route: 'CandAppHome', locale: 'en' });
  await waitForLoginForm(page, candidateHome, testIds.candidate.login.email);

  // Log in as the candidate just registered above (base dataset CA-AA-1).
  await page.getByTestId(testIds.candidate.login.email).fill(TEST_CANDIDATE_EMAIL);
  await page.getByTestId(testIds.candidate.password.field).fill(TEST_CANDIDATE_PASSWORD);
  await page.getByTestId(testIds.candidate.login.submit).click();

  // Wait for navigation away from the login page
  await expect(page).not.toHaveURL(/.*login.*/);

  // Save authenticated state for downstream tests
  await page.context().storageState({ path: authFile });
});
