/**
 * Login → Go to opinions → Open 1st question → Expect hero hidden.
 *
 * The candidate navigates through the questions OVERVIEW (not a raw deep link) before opening the first opinion question. The per-question URL is keyed on the INTERNAL question id, not the seed external_id, so a direct goto() with an external_id cannot reach a question; the overview's card is the way to a question by its label, matching the canonical perm-answers-locked navigation pattern.
 *
 * With hideHero=true the figure still mounts but its <Hero> child is gated out by `!hideHero && customData?.hero` ([questionId]/+page.svelte:266), so the figure carries no img/span. An empty <figure> has a zero-height box under Tailwind preflight, so we assert `toBeAttached()` (not `toBeVisible()`) and anchor page-readiness on the answer input.
 *
 * Rigidity contract: no soft assertions, no .catch fallbacks, testid-only.
 */

import { expect, test } from '@playwright/test';
import path from 'path';
import { createContestantQuestionsOverviewPage } from '../../fixtures/contestant/contestantQuestionsOverviewPage.fixture';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';

const STORAGE_STATE_PATH = path.join(TESTS_DIR, '../playwright/.auth/perm-hide-hero.json');

test.describe('perm-hide-hero', () => {
  test.use({ storageState: STORAGE_STATE_PATH });

  test('hideHero=true: contestant-questions-hero figure has no img/span children', async ({ page }) => {
    // Click through the overview (canonical perm-answers-locked pattern): goToPage warms the candidate context, goToQuestion expands categories, opens the labelled first opinion question, and awaits navigation off the overview. Match by displayed label (buildMinimal seeds `[QU-OPIN-L5-1]`).
    const questionsOverview = createContestantQuestionsOverviewPage(page);
    await questionsOverview.goToPage();
    await questionsOverview.goToQuestion(/\[QU-OPIN-L5-1\]/);

    // Page-ready anchor: the answer input only mounts once the [questionId] page renders (opinionQuestions populated, layout gate passed).
    await expect(page.getByTestId(testIds.contestant.questions.answerInput)).toBeVisible();

    // The hero <figure> always mounts; hideHero=true suppresses its <Hero> child, so it carries no img/span. Empty figure → zero-height box → assert attached, not visible.
    const hero = page.getByTestId(testIds.contestant.questions.hero);
    await expect(hero).toBeAttached();
    // The hero's <Hero> child renders the only img/span inside the figure; asserting zero such descendants is the suppression check. A raw CSS sub-locator scoped to the testid'd figure is intentional here (there is no role/text handle for "any img or span").
    // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
    await expect(hero.locator('img, span')).toHaveCount(0);
  });
});
