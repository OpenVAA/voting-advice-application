/**
 * Voter walks the located + answered flow via the voter-journey fixture's
 * `minimalVoterResultsPage`, landing on /results with all opinion
 * questions answered. With `entities.hideIfMissingAnswers.candidate=true`
 * AND cand-2 missing an answer to Q2, cand-2 is filtered out — only cand-1
 * (`[CA1A]` first_name marker) renders.
 *
 * Fixture choice: this perm uses the `buildMinimal` (1-election +
 * 1-constituency) dataset, so the elections/constituencies pages
 * auto-imply and the /questions intro page is skipped. `answeredVoterPage`
 * hard-waits for the intro `voter-questions-start` button and times out
 * here; `minimalVoterResultsPage` drives the robust race-based
 * `navigateToFirstQuestion` traversal that tolerates every skipped
 * intermediate page (single-election + single-constituency auto-imply
 * redirects).
 *
 * The hideIfMissingAnswers gate applies to CANDIDATE-missing-answers
 * (cand-2 missing Q2 in the perm template); the VOTER answering all
 * opinion questions via `minimalVoterResultsPage`'s default
 * `answerMode='max'` does not affect the candidate filter.
 *
 * Assert ONLY on candidate visibility (cand-1 present, cand-2 hidden). DO NOT
 * assert on org count — the cascade gate at supabaseDataProvider.ts:384 may
 * suppress orgs whose every-candidate is filtered, but cand-1 in or-1 keeps
 * or-1 alive.
 *
 * Rigidity contract: no soft assertions, no .catch fallbacks, testid-only.
 */

import { expect } from '@playwright/test';
import { minimalVoterResultsTest as test } from '../../fixtures/voter/minimalVoterResultsPage.fixture';
import { testIds } from '../../utils/testIds';

test.describe('perm-hide-if-missing-answers', () => {
  test('hideIfMissingAnswers.candidate=true: cand-1 visible, cand-2 hidden on /results', async ({
    minimalVoterResultsPage
  }) => {
    // Assert ONLY on candidate visibility. Filter the canonical
    // entity-card testid by [CA1A] / [CA2B] first-name markers
    // seeded by buildMinimal's buildCandidate(candLetter='A' for cand-1,
    // 'B' for cand-2; orgN=1 then orgN=2 → `[CA1A]` and `[CA2B]`).
    const cards = minimalVoterResultsPage.getByTestId(testIds.voter.results.card);
    await expect(cards.filter({ hasText: /\[CA1A\]/ })).toHaveCount(1);
    await expect(cards.filter({ hasText: /\[CA2B\]/ })).toHaveCount(0);
  });
});
