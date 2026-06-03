/**
 * Topology: 1 election, 1 CG, 1 CO, 2 candidates. Settings override:
 * `access.voterApp: false` — the voter-app routes (`/`, `/elections`) render
 * the MaintenancePage (root <main> + <h1>, voter start button HIDDEN) while
 * the candidate-app route (`/en/candidate`) remains available (login email
 * input visible).
 *
 * Rigidity contract: every assertion is HARD — no expect.soft, no try/catch
 * wrapping expect(), no .catch fallbacks.
 */

import { expect, test } from '@playwright/test';
import { testIds } from '../../utils/testIds';

test.describe('perm-disable-voter-app', () => {
  test('voterApp disabled: / + /elections show maintenance; /candidate available', async ({ page }) => {
    // GET /en — maintenance page on the voter-app root route.
    // reason: MAINTENANCE-mode probe (access.voterApp=false) — the home page
    // renders MaintenancePage with the start button HIDDEN, so the voterHomePage
    // goToPage (which hard-asserts the voter-home anchor visible) would fail by
    // design. Kept inline as a raw goto.
    await page.goto('/en');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByTestId(testIds.voter.home.startButton)).toBeHidden();

    // GET /en/elections — maintenance page on the voter-app elections route.
    // reason: same MAINTENANCE-mode probe — asserts the maintenance surface,
    // not a clean page load; goToPage's visibility assertion would fail.
    await page.goto('/en/elections');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByTestId(testIds.voter.home.startButton)).toBeHidden();

    // GET /en/candidate — NON-maintenance: candidate login page renders.
    // reason: candidate-app route — out of voter-fixture scope (voter routes only).
    await page.goto('/en/candidate');
    await expect(page.getByTestId(testIds.candidate.login.email)).toBeVisible();
  });
});
