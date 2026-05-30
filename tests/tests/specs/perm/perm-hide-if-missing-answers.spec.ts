/**
 * perm-hide-if-missing-answers — Phase 91 Plan 02 (TIR6:95-102, A6).
 *
 * Voter walks the standard election + constituency selector flow then
 * lands on /results. With `entities.hideIfMissingAnswers.candidate=true`
 * AND cand-2 missing an answer to Q2, cand-2 is filtered out — only cand-1
 * (`[CA1A]` first_name marker) renders.
 *
 * Per Pitfall 6: assert ONLY on candidate visibility (cand-1 present,
 * cand-2 hidden). DO NOT assert on org count — the cascade gate at
 * supabaseDataProvider.ts:384 may suppress orgs whose every-candidate is
 * filtered, but cand-1 in or-1 keeps or-1 alive.
 *
 * Rigidity contract: no soft assertions, no .catch fallbacks, testid-only.
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-6.md:95-102.
 */

import { expect, test } from '@playwright/test';
import { testIds } from '../../utils/testIds';

test.describe('perm-hide-if-missing-answers', () => {
  test('hideIfMissingAnswers.candidate=true: cand-1 visible, cand-2 hidden on /results', async ({
    page
  }) => {
    // 1. Voter home → election selector.
    await page.goto('/en');
    await page.getByTestId(testIds.voter.home.startButton).click();

    // 2. Election selector — single election auto-selected.
    await expect(page.getByTestId(testIds.voter.elections.continue)).toBeVisible();
    await page.getByTestId(testIds.voter.elections.continue).click();

    // 3. Constituency selector — single CO auto-selected.
    await expect(page.getByTestId(testIds.voter.constituencies.continue)).toBeVisible();
    await page.getByTestId(testIds.voter.constituencies.continue).click();

    // 4. Land on /results.
    await page.goto('/en/results');

    // 5. Per Pitfall 6: assert ONLY on candidate visibility. Filter the
    //    canonical entity-card testid by [CA1A] / [CA2B] first-name markers
    //    seeded by buildMinimal's buildCandidate(candLetter='A' for cand-1,
    //    'B' for cand-2; orgN=1 then orgN=2 → `[CA1A]` and `[CA2B]`).
    const cards = page.getByTestId(testIds.voter.results.card);
    await expect(cards.filter({ hasText: /\[CA1A\]/ })).toHaveCount(1);
    await expect(cards.filter({ hasText: /\[CA2B\]/ })).toHaveCount(0);
  });
});
