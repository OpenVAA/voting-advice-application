/**
 * perm-disable-voter-app — Phase 89 Plan 04 (TIR4-PERM-01).
 *
 * Topology: 1 election, 1 CG, 1 CO, 2 candidates. Settings override:
 * `access.voterApp: false` — the voter-app routes (`/`, `/elections`) render
 * the MaintenancePage (root <main> + <h1>, voter start button HIDDEN) while
 * the candidate-app route (`/en/candidate`) remains available (login email
 * input visible).
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-4.md:36-42.
 *
 * Rigidity contract (TIR4:8-12 + Phase 88 lineage): every assertion HARD —
 * no expect.soft, no try/catch wrapping expect(), no .catch fallbacks.
 */

import { expect, test } from '@playwright/test';
import { testIds } from '../../utils/testIds';

test.describe('perm-disable-voter-app', () => {
  test('voterApp disabled: / + /elections show maintenance; /candidate available', async ({ page }) => {
    // GET /en — maintenance page on the voter-app root route.
    await page.goto('/en');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByTestId(testIds.voter.home.startButton)).toBeHidden();

    // GET /en/elections — maintenance page on the voter-app elections route.
    await page.goto('/en/elections');
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByTestId(testIds.voter.home.startButton)).toBeHidden();

    // GET /en/candidate — NON-maintenance: candidate login page renders.
    await page.goto('/en/candidate');
    await expect(page.getByTestId(testIds.candidate.login.email)).toBeVisible();
  });
});
