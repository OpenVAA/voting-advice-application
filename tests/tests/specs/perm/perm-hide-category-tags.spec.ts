/**
 * `questions.showCategoryTags=false` removes the CategoryTag from the
 * question heading. Asserting `expect(categoryTag).toHaveCount(0)` on
 * /questions covers the negative — but a lone absence assertion is equally
 * satisfied by a heading that renders no tags at all, so it is paired here
 * with a positive control: the COMPLEMENTARY ElectionTag must be present.
 * The dataset seeds TWO elections
 * (`packages/dev-seed/src/templates/e2e/perm/perm-hide-category-tags.ts`)
 * precisely so that tag can render — `getElectionsToShow`
 * (`apps/frontend/src/lib/utils/questions/electionTags.ts:13`) returns `[]`
 * below two elections. Deleting the tag-render path therefore reds this spec
 * at the presence assertion (ASSERT-05 / finding F9).
 *
 * Rigidity contract: no soft assertions, no .catch fallbacks, testid-only.
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
    // waiting for voter-elections-continue. The helper lands on a real
    // /questions/<id> page — the heading is where CategoryTag would render.
    await navigateToFirstQuestion(page);
    await expect(page.getByTestId(testIds.shared.categoryTag)).toHaveCount(0);

    // Positive control (ASSERT-05 / F9). The absence assertion above is also
    // satisfied by a page that renders no tags at all — a deleted render path,
    // a renamed testid, a heading that never mounted. The dataset's second
    // election is the seeded precondition that lets the COMPLEMENTARY
    // ElectionTag (left enabled by the perm baseline's showElectionTags) render
    // here, so asserting its presence is what makes this spec fail when the
    // tag-render path stops rendering anywhere.
    //
    // Phase 140 WR-01: uses the auto-retrying web-first locator assertion
    // (`.not.toHaveCount(0)`) instead of a single-shot `.count()` + generic
    // `expect()` — the sibling absence assertion above retries; this one
    // must too, so a transient pre-flush render state cannot red the spec
    // (`advanceClick`'s docblock in `voterNavigation.ts` documents a residual
    // timing exposure on exactly this path). The message argument is supported on locator
    // assertions too, so the retry and the diagnostic message are not
    // mutually exclusive.
    await expect(
      page.getByTestId(testIds.shared.electionTag),
      'ASSERT-05 positive control: the perm-hide-category-tags dataset seeds elections: 2 so the complementary election-tag must render on /questions; with none rendered, the category-tag absence assertion above is vacuously satisfied by a heading that renders no tags at all'
    ).not.toHaveCount(0);
  });
});
