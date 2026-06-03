/**
 * @file candidateHomePage fixture.
 *
 * Function-fixture for the candidate /candidate home page (the three-task
 * dashboard: profile / opinions / preview).
 *
 * Surface:
 *  - expectTasks({ enabled, disabled }) — partitioned enabled/disabled
 *                                          assertion across the three task
 *                                          buttons. Replaces the prior
 *                                          state-enum expectThreeTasks(state).
 *  - expectStatusMessage(text?)         — visibility + optional text-content
 *                                          match on candidate-home-status.
 *  - clickTask('profile' | 'opinions' | 'preview') — dispatch to the
 *                                          candidate-home-{profile,questions,
 *                                          preview} button. Note: 'opinions'
 *                                          maps to candidate-home-questions
 *                                          (the UI label is "Opinions" but the
 *                                          testid is `candidate-home-questions`).
 *  - clickContinue()                    — click candidate-home-continue
 *                                          (variant="main" primary action).
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`,
 * NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

export type CandidateHomeTask = 'profile' | 'opinions' | 'preview';

/**
 * Maps the SETTINGS-keyword task identifiers to the underlying testids on
 * `candidate/(protected)/+page.svelte`.
 * 'opinions' → candidate-home-questions per the source-of-truth attribute
 * at `apps/frontend/src/routes/candidate/(protected)/+page.svelte:131`.
 */
const TASK_TESTIDS: Readonly<Record<CandidateHomeTask, string>> = Object.freeze({
  profile: 'candidate-home-profile',
  opinions: testIds.candidate.home.questions,
  preview: 'candidate-home-preview'
});

export function createCandidateHomePage(page: Page) {
  return {
    /**
     * Assert the enabled/disabled partitioning of the three home-page task
     * buttons. Replaces the prior state-enum expectThreeTasks(state) surface
     * with an explicit per-task assertion.
     */
    async expectTasks(spec: { enabled: Array<CandidateHomeTask>; disabled: Array<CandidateHomeTask> }): Promise<void> {
      for (const task of spec.enabled) {
        await expect.soft(page.getByTestId(TASK_TESTIDS[task])).toBeEnabled();
      }
      for (const task of spec.disabled) {
        await expect.soft(page.getByTestId(TASK_TESTIDS[task])).toBeDisabled();
      }
    },

    /**
     * Assert the candidate-home-status paragraph is visible. When `text`
     * is supplied, additionally assert the rendered content matches.
     * Folds in the prior expectCompletedMessage() use case (callers pass a
     * "completed"-matching RegExp).
     */
    async expectStatusMessage(text?: RegExp): Promise<void> {
      const status = page.getByTestId(testIds.candidate.home.statusMessage);
      await expect.soft(status).toBeVisible();
      if (text !== undefined) {
        await expect.soft(status).toContainText(text);
      }
    },

    /**
     * Click one of the three task buttons. Dispatches via TASK_TESTIDS.
     */
    async clickTask(task: CandidateHomeTask): Promise<void> {
      await page.getByTestId(TASK_TESTIDS[task]).click();
    },

    /**
     * Click the candidate-home-continue (variant="main") primary action.
     */
    async clickContinue(): Promise<void> {
      await page.getByTestId('candidate-home-continue').click();
    }
  };
}

export type CandidateHomePageFixture = ReturnType<typeof createCandidateHomePage>;
