/**
 * @file contestant.smoke.ts.
 *
 * A contestant on the deployed application: signs in with a password, sees a home on which every task is complete, and signs out without a confirmation dialog.
 *
 * The account is created once, out of band, on the hosted project, and its address and password reach this spec only as the inputs `SMOKE_CONTESTANT_EMAIL` and `SMOKE_CONTESTANT_PASSWORD`. A missing input fails the test by name before any page action; the voter spec does not depend on this one.
 *
 * Tracing, screenshots and video are off for this file, so the typed credentials reach no artifact of the run.
 *
 * Rigidity contract (project E2E Hard Rule): every assertion is hard — no soft assertion, no try/catch around expect(), no .catch fallback.
 */

import { expect, test } from '@playwright/test';
import { createContestantHomePage } from '../fixtures/contestant/contestantHomePage.fixture';
import { createContestantLoginPage } from '../fixtures/contestant/contestantLoginPage.fixture';
import { createContestantLogoutButton } from '../fixtures/contestant/contestantLogoutButton.fixture';
import { TIMEOUTS } from '../helpers';
import { requireSmokeInputs } from '../utils/deployedTarget';

test.use({ trace: 'off', screenshot: 'off', video: 'off' });

test('a contestant signs in with a password, sees a complete home and signs out', async ({ page }) => {
  const { SMOKE_CONTESTANT_EMAIL: email, SMOKE_CONTESTANT_PASSWORD: password } = requireSmokeInputs(
    ['SMOKE_CONTESTANT_EMAIL', 'SMOKE_CONTESTANT_PASSWORD'],
    process.env
  );
  await createContestantLoginPage(page).signInFromCold(email, password);
  await expect(page).not.toHaveURL(/.*login.*/, { timeout: TIMEOUTS.slowPage });
  await createContestantHomePage(page).expectTaskList({
    nomination: 'complete',
    profile: 'complete',
    questions: 'complete'
  });
  await createContestantLogoutButton(page).clickWithoutDialog();
});
