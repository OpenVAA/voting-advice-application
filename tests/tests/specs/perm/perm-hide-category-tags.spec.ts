/**
 * perm-hide-category-tags — Phase 91 Plan 02 (TIR6:111-115, A8).
 *
 * `questions.showCategoryTags=false` removes the CategoryTag from the
 * question heading. Asserting `expect(categoryTag).toHaveCount(0)` on
 * /questions covers the negative.
 *
 * Rigidity contract: no soft assertions, no .catch fallbacks, testid-only.
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-6.md:111-115.
 */

import { expect, test } from '@playwright/test';
import { testIds } from '../../utils/testIds';

test.describe('perm-hide-category-tags', () => {
  test('showCategoryTags=false: category-tag absent on /questions', async ({ page }) => {
    await page.goto('/en');
    await page.getByTestId(testIds.voter.home.startButton).click();
    await expect(page.getByTestId(testIds.voter.elections.continue)).toBeVisible();
    await page.getByTestId(testIds.voter.elections.continue).click();
    await expect(page.getByTestId(testIds.voter.constituencies.continue)).toBeVisible();
    await page.getByTestId(testIds.voter.constituencies.continue).click();

    await page.goto('/en/questions');
    await expect(page.getByTestId(testIds.shared.categoryTag)).toHaveCount(0);
  });
});
