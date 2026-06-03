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
import { navigateToFirstQuestion } from '../../utils/voterNavigation';

test.describe('perm-hide-election-tags', () => {
  test('showElectionTags=false: election-tag absent on /questions', async ({ page }) => {
    // Voter walk: home → (intro) → elections → constituencies → first question.
    // Uses the robust race-based `navigateToFirstQuestion` (the same passer the
    // voter-journey fixture uses) instead of a hand-rolled home→elections-continue
    // walk: the hand-roll skipped the intro page ("Let's start!") and timed out
    // waiting for voter-elections-continue (Pitfall 6). The helper lands on a
    // real /questions/<id> page — the heading is where ElectionTag would render.
    await navigateToFirstQuestion(page);
    await expect(page.getByTestId(testIds.shared.electionTag)).toHaveCount(0);
  });
});
