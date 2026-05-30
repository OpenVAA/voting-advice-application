/**
 * perm-hide-election-tags — Phase 91 Plan 02 (TIR6:104-108, A7).
 *
 * `elections.showElectionTags=false` removes the ElectionTag from the
 * question heading. With 2 elections in the dataset the tag would normally
 * render to disambiguate the election in the question heading. Asserting
 * `expect(electionTag).toHaveCount(0)` on /questions covers the negative.
 *
 * Rigidity contract: no soft assertions, no .catch fallbacks, testid-only.
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-6.md:104-108.
 */

import { expect, test } from '@playwright/test';
import { testIds } from '../../utils/testIds';

test.describe('perm-hide-election-tags', () => {
  test('showElectionTags=false: election-tag absent on /questions', async ({ page }) => {
    // Voter walk: home → elections-selector → constituencies-selector → /questions.
    await page.goto('/en');
    await page.getByTestId(testIds.voter.home.startButton).click();
    await expect(page.getByTestId(testIds.voter.elections.continue)).toBeVisible();
    await page.getByTestId(testIds.voter.elections.continue).click();
    await expect(page.getByTestId(testIds.voter.constituencies.continue)).toBeVisible();
    await page.getByTestId(testIds.voter.constituencies.continue).click();

    // Land explicitly on /questions (rather than /results) — the question
    // heading is where ElectionTag would otherwise render.
    await page.goto('/en/questions');
    await expect(page.getByTestId(testIds.shared.electionTag)).toHaveCount(0);
  });
});
