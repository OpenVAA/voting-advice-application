/**
 * @file candidatePreviewPage fixture — Phase 89 Plan 02 (TIR4:79 + 245-252 + D-89-02).
 *
 * Function-fixture for the candidate /candidate/preview page
 * (`apps/frontend/src/routes/candidate/(protected)/preview/+page.svelte`)
 * which renders the candidate's own profile via the shared EntityDetails
 * component.
 *
 * Surface (TIR4:79 + 245-252):
 *  - expectInfoAnswer(qName, aValue)              — assert the named info
 *                                                    question is rendered AND
 *                                                    its answer value matches.
 *  - expectOpinionAnswer(qName, aNthChecked)      — assert the named opinion
 *                                                    question is rendered;
 *                                                    aNthChecked = 0-indexed
 *                                                    checked choice OR null
 *                                                    for "rendered-but-unanswered".
 *  - expectPortraitVisible()                      — assert the candidate
 *                                                    portrait image is in DOM.
 *  - expectNoVoterComparison()                    — assert NO voter-comparison
 *                                                    sub-match messaging is
 *                                                    rendered (the preview
 *                                                    view is from the
 *                                                    candidate's perspective,
 *                                                    so "you and X agree"-type
 *                                                    text must not appear).
 *
 * Internally delegates to the shared EntityDetails testids (candidate preview
 * reuses voter EntityDetails per 89-RESEARCH).
 *
 * **Rigidity contract** (Phase 88 Plan 04 SCOPE acceptance #6):
 * - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *   `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export function createCandidatePreviewPage(page: Page) {
  function container(): Locator {
    return page.getByTestId(testIds.candidate.preview.container);
  }

  return {
    /**
     * Assert the info-question matching `qName` is rendered inside the
     * preview, and its visible answer slot contains `aValue`.
     */
    async expectInfoAnswer(qName: string | RegExp, aValue: string | RegExp): Promise<void> {
      const c = container();
      // EntityDetails renders info items via the info-item testid (shared
      // with the voter results entity details surface). The full preview
      // container may render either the EntityDetails directly or a
      // composed surface; we scope to the container and filter by qName.
      const item = c.getByTestId(testIds.voter.results.infoItem).filter({ hasText: qName }).first();
      await expect(item).toBeVisible();
      await expect(item).toContainText(aValue);
    },

    /**
     * Assert the opinion-question matching `qName` is rendered. When
     * `aNthChecked` is a number, additionally assert the nth choice is in
     * the checked state. When `null`, assert NO choice is in the checked
     * state (rendered-but-unanswered).
     */
    async expectOpinionAnswer(qName: string | RegExp, aNthChecked: number | null): Promise<void> {
      const c = container();
      // EntityDetails renders Info / Opinions (/ Children) as tabs and only mounts
      // the active tab's content (`info` is active by default). Opinion questions
      // are therefore absent from the DOM until the Opinions tab is activated.
      await c.getByRole('tab', { name: /opinions/i }).click();
      const question = c
        .getByTestId(testIds.voter.entityDetail.opinionQuestion)
        .filter({ hasText: qName })
        .first();
      await expect(question).toBeVisible();
      const choices = question.getByTestId('question-choice');
      if (aNthChecked === null) {
        // Assert NO choice has the checked-state indicator. The checked-
        // indicator is the entity-selected-answer sr-only sibling marker
        // added on QuestionChoices.svelte (per Phase 89-01 testid catalog
        // + Phase 86 chain). Absence means rendered-but-unanswered.
        await expect(question.getByTestId(testIds.voter.entityDetail.entitySelectedAnswer)).toHaveCount(0);
        return;
      }
      // Assert the nth choice is the selected-answer.
      const choice = choices.nth(aNthChecked);
      await expect(choice).toBeVisible();
      // reason: the marker is a sr-only SIBLING of the choice's `<input
      // data-testid="question-choice">` inside their shared `<label>` (an
      // <input> cannot have children — see QuestionChoices.svelte:284). The only
      // way to reach the sibling from the input locator is an xpath parent-axis
      // traversal; the parent <label> carries no stable testId, so there is no
      // getByTestId/getByRole path to the parent. The chained getByTestId stays.
      // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
      const choiceLabel = choice.locator('xpath=..');
      await expect(
        choiceLabel.getByTestId(testIds.voter.entityDetail.entitySelectedAnswer)
      ).toHaveCount(1);
    },

    /**
     * Assert the candidate portrait image is rendered.
     */
    async expectPortraitVisible(): Promise<void> {
      await expect(container().getByRole('img').first()).toBeVisible();
    },

    /**
     * Assert no voter-comparison messaging is rendered. The candidate's
     * own preview surfaces the candidate's answers but MUST NOT compare
     * against a hypothetical voter (score-gauge, sub-matches, "you and X
     * agree/disagree" copy). Per TIR4:251-252 this is a hard absence
     * assertion.
     */
    async expectNoVoterComparison(): Promise<void> {
      const c = container();
      await expect(c.getByTestId(testIds.voter.results.scoreGauge)).toHaveCount(0);
      await expect(c.getByTestId(testIds.voter.results.subMatches)).toHaveCount(0);
    }
  };
}

export type CandidatePreviewPageFixture = ReturnType<typeof createCandidatePreviewPage>;
