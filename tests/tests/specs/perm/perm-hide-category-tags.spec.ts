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
import { navigateToFirstQuestion } from '../../utils/voterNavigation';

test.describe('perm-hide-category-tags', () => {
  test('showCategoryTags=false: category-tag absent on /questions', async ({ page }) => {
    // Voter walk: home → (intro) → elections → constituencies → first question.
    // Uses the robust race-based `navigateToFirstQuestion` (the same passer the
    // voter-journey fixture uses) instead of a hand-rolled home→elections-continue
    // walk: the hand-roll skipped the intro page ("Let's start!") and timed out
    // waiting for voter-elections-continue (Pitfall 6). The helper lands on a
    // real /questions/<id> page — the heading is where CategoryTag would render.
    await navigateToFirstQuestion(page);
    await expect(page.getByTestId(testIds.shared.categoryTag)).toHaveCount(0);
  });
});
