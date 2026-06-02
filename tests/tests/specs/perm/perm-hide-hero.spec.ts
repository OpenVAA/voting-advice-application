/**
 * perm-hide-hero — Phase 91 Plan 02 (TIR6:24-32, A2).
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-6.md:24-32 —
 *   Login → Go to opinions → Open 1st question → Expect hero hidden.
 *
 * The candidate navigates through the questions OVERVIEW (not a raw deep
 * link) before opening the first opinion question. This is load-bearing:
 * deep-linking straight to /candidate/questions/[questionId] races the
 * candidate-context data-resolution chain (reactiveDataRoot → userData
 * nominations → selectedElections/selectedConstituencies → opinionQuestions).
 * Until that chain settles, `opinionQuestions.length === 0` and the questions
 * +layout.svelte:57 renders the `error.noQuestions` empty state instead of
 * the question page — so the candidate-questions-hero <figure> never mounts
 * ("element(s) not found"). The layout cannot tell "still loading" from
 * "genuinely empty", which is why the symptom surfaces transiently in other
 * tests. Routing via the overview (which itself gates on opinionQuestions
 * being populated) warms the context first, matching the TIR6 walk and the
 * canonical perm-answers-locked navigation pattern. The per-question URL is
 * also keyed on the INTERNAL question id, not the seed external_id, so a
 * direct goto() with an external_id is impossible regardless of timing.
 *
 * With hideHero=true the figure still mounts but its <Hero> child is gated
 * out by `!hideHero && customData?.hero` ([questionId]/+page.svelte:266), so
 * the figure carries no img/span. An empty <figure> has a zero-height box
 * under Tailwind preflight, so we assert `toBeAttached()` (not
 * `toBeVisible()`) and anchor page-readiness on the answer input.
 *
 * Rigidity contract: no soft assertions, no .catch fallbacks, testid-only.
 */

import { expect, test } from '@playwright/test';
import path from 'path';
import { createCandidateQuestionsOverviewPage } from '../../fixtures/candidate/candidateQuestionsOverviewPage.fixture';
import { testIds } from '../../utils/testIds';
import { TESTS_DIR } from '../../utils/testsDir';

const STORAGE_STATE_PATH = path.join(TESTS_DIR, '../playwright/.auth/perm-hide-hero.json');

test.describe('perm-hide-hero', () => {
  test.use({ storageState: STORAGE_STATE_PATH });

  test('hideHero=true: candidate-questions-hero figure has no img/span children', async ({ page }) => {
    // Click through the overview (canonical perm-answers-locked pattern):
    // goToPage warms the candidate context, goToQuestion expands categories,
    // opens the labelled first opinion question, and awaits navigation off the
    // overview. Match by displayed label (buildMinimal seeds `[QU-OPIN-L5-1]`).
    const questionsOverview = createCandidateQuestionsOverviewPage(page);
    await questionsOverview.goToPage();
    await questionsOverview.goToQuestion(/\[QU-OPIN-L5-1\]/);

    // Page-ready anchor: the answer input only mounts once the [questionId]
    // page renders (opinionQuestions populated, layout gate passed).
    await expect(page.getByTestId(testIds.candidate.questions.answerInput)).toBeVisible();

    // The hero <figure> always mounts; hideHero=true suppresses its <Hero>
    // child, so it carries no img/span. Empty figure → zero-height box →
    // assert attached, not visible.
    const hero = page.getByTestId(testIds.candidate.questions.hero);
    await expect(hero).toBeAttached();
    // The hero's <Hero> child renders the only img/span inside the figure;
    // asserting zero such descendants is the suppression check. A raw CSS
    // sub-locator scoped to the testid'd figure is intentional here (there is
    // no role/text handle for "any img or span").
    // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
    await expect(hero.locator('img, span')).toHaveCount(0);
  });
});
