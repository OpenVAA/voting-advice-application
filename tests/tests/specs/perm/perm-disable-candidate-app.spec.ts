/**
 * perm-disable-candidate-app — Phase 89 Plan 04 (TIR4-PERM-02).
 *
 * Topology: 1 election, 1 CG, 1 CO, 2 candidates. Settings override:
 * `access.candidateApp: false` — the candidate-app route (`/en/candidate`)
 * renders the MaintenancePage (root <main> + <h1>, candidate login email
 * input HIDDEN) while the voter-app routes (`/`, `/elections`) remain
 * available (voter start button visible at `/en`).
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-4.md:44-50.
 *
 * Rigidity contract (TIR4:8-12 + Phase 88 lineage): every assertion HARD —
 * no expect.soft, no try/catch wrapping expect(), no .catch fallbacks.
 */

import { expect, test } from '../../fixtures/views';
import { testIds } from '../../utils/testIds';

test.describe('perm-disable-candidate-app', () => {
  test('candidateApp disabled: /candidate shows maintenance; / + /elections available', async ({
    page,
    voterHomePage
  }) => {
    // reason: candidate-route navigation (maintenance assertion) — out of Phase 92 voter-fixture scope.
    await page.goto('/en/candidate');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByTestId(testIds.candidate.login.email)).toBeHidden();

    // GET /en — NON-maintenance: voter home renders normally (goToPage asserts the
    // home load anchor, then the test asserts the start button is visible).
    await voterHomePage.goToPage('en');
    await expect(page.getByTestId(testIds.voter.home.startButton)).toBeVisible();

    // reason: /elections has no voter-page fixture in scope; assertion is the generic
    // getByRole('main') landmark only — keep the raw goto.
    await page.goto('/en/elections');
    await expect(page.getByRole('main')).toBeVisible();
  });
});
