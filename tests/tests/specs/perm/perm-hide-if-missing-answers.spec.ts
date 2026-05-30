/**
 * perm-hide-if-missing-answers — Phase 91 Plan 02 (TIR6:95-102, A6).
 *
 * Voter walks the canonical located + answered flow via the voter-mega
 * fixture's `answeredVoterPage`, landing on /results with all opinion
 * questions answered. With `entities.hideIfMissingAnswers.candidate=true`
 * AND cand-2 missing an answer to Q2, cand-2 is filtered out — only cand-1
 * (`[CA1A]` first_name marker) renders.
 *
 * Phase 91 Plan 05 (CR-02 closure): voter walk delegated to
 * voter-mega.fixture.ts answeredVoterPage; hand-rolled walk eliminated
 * per 91-VERIFICATION.md CR-02 BLOCKER. The prior hand-roll (home →
 * elections-continue → constituencies-continue → direct goto to /results)
 * was vulnerable to single-election + single-constituency auto-imply
 * redirects skipping the elections.continue testid (Pitfall 6).
 *
 * The hideIfMissingAnswers gate applies to CANDIDATE-missing-answers
 * (cand-2 missing Q2 in the perm template); the VOTER answering all
 * opinion questions via `answeredVoterPage`'s default `answerMode='max'`
 * does not affect the candidate filter.
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

import { expect } from '@playwright/test';
import { voterMegaTest as test } from '../../fixtures/voter-mega.fixture';
import { testIds } from '../../utils/testIds';

test.describe('perm-hide-if-missing-answers', () => {
  test('hideIfMissingAnswers.candidate=true: cand-1 visible, cand-2 hidden on /results', async ({
    answeredVoterPage
  }) => {
    // Per Pitfall 6: assert ONLY on candidate visibility. Filter the
    // canonical entity-card testid by [CA1A] / [CA2B] first-name markers
    // seeded by buildMinimal's buildCandidate(candLetter='A' for cand-1,
    // 'B' for cand-2; orgN=1 then orgN=2 → `[CA1A]` and `[CA2B]`).
    const cards = answeredVoterPage.getByTestId(testIds.voter.results.card);
    await expect(cards.filter({ hasText: /\[CA1A\]/ })).toHaveCount(1);
    await expect(cards.filter({ hasText: /\[CA2B\]/ })).toHaveCount(0);
  });
});
