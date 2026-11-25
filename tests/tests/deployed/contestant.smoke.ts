/**
 * @file contestant.smoke.ts.
 *
 * A contestant on the deployed application: signs in with a password, sees a home on which every task is complete, and signs out without a confirmation dialog.
 *
 * The account is created once, out of band, on the hosted project, and its address and password reach this spec only as the inputs `SMOKE_CONTESTANT_EMAIL` and `SMOKE_CONTESTANT_PASSWORD`. A missing input, or a base URL whose origin is not `public_origin` of the committed staging Supabase tfvars, fails the test by name before any page action, so the credentials are typed into the dedicated deployment's own pages alone. The voter spec does not depend on this one.
 *
 * Tracing, screenshots and video are off for this file, and the deployed config writes no HTML report and no page snapshot when a failed test closes. A failed matcher still writes an accessibility snapshot of the page into `error-context.md`, so the sign-in form is emptied before any assertion when the sign-in has not led away from it. The per-test output directory of a run with the two inputs is still treated as secret: it is never published, uploaded or attached.
 *
 * Rigidity contract (project E2E Hard Rule): every assertion is hard — no soft assertion, no try/catch around expect(), no .catch fallback.
 */

import { expect, test } from '@playwright/test';
import path from 'path';
import { createContestantHomePage } from '../fixtures/contestant/contestantHomePage.fixture';
import { createContestantLoginPage } from '../fixtures/contestant/contestantLoginPage.fixture';
import { createContestantLogoutButton } from '../fixtures/contestant/contestantLogoutButton.fixture';
import { TIMEOUTS } from '../helpers';
import { requireCredentialOrigin, requireSmokeInputs } from '../utils/deployedTarget';
import { testIds } from '../utils/testIds';
import { TESTS_DIR } from '../utils/testsDir';
import type { Page } from '@playwright/test';

test.use({ trace: 'off', screenshot: 'off', video: 'off' });

test('a contestant signs in with a password, sees a complete home and signs out', async ({ page, baseURL }) => {
  const { SMOKE_CONTESTANT_EMAIL: email, SMOKE_CONTESTANT_PASSWORD: password } = requireSmokeInputs(
    ['SMOKE_CONTESTANT_EMAIL', 'SMOKE_CONTESTANT_PASSWORD'],
    process.env
  );
  // `TESTS_DIR` is `<repo-root>/tests/tests`, so the root is two levels up.
  requireCredentialOrigin(baseURL, path.resolve(TESTS_DIR, '..', '..'));
  const login = createContestantLoginPage(page);
  await login.signInFromCold(email, password);
  await emptyFormUnlessSignedIn(page);
  await expect(page).not.toHaveURL(/.*login.*/, { timeout: TIMEOUTS.slowPage });
  await createContestantHomePage(page).expectTaskList({
    nomination: 'complete',
    profile: 'complete',
    questions: 'complete'
  });
  await createContestantLogoutButton(page).clickWithoutDialog();
});

/**
 * Wait for a submitted sign-in to lead away from the sign-in screen, and empty the email and password fields when it has not.
 *
 * A failed matcher writes an accessibility snapshot of the page into the test's `error-context.md`, and that snapshot holds the value of every input, a password field's included. Emptying the fields after a refused sign-in keeps the address and the password out of the report of the assertion that follows. A field that is not on the page is left alone.
 *
 * The step asserts nothing: the caller asserts where the sign-in led.
 */
async function emptyFormUnlessSignedIn(page: Page): Promise<void> {
  const signedIn = await page
    .waitForURL((url) => !/login/.test(url.href), { timeout: TIMEOUTS.slowPage, waitUntil: 'commit' })
    .then(
      () => true,
      () => false
    );
  if (signedIn) return;
  for (const field of [
    page.getByTestId(testIds.contestant.login.email),
    page.getByTestId(testIds.shared.account.password.field)
  ]) {
    if ((await field.count()) > 0) await field.clear({ timeout: TIMEOUTS.element });
  }
}
