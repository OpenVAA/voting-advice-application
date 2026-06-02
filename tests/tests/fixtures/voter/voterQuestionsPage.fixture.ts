/**
 * @file voterQuestionsPage fixture — Phase 92 Plan 03 (WS2 FIXTURES, D-06/D-07/D-08).
 *
 * Function-fixture for the voter questions (intro/listing) page
 * (`apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte`).
 * Rebuilds the deleted `pages/voter/QuestionsPage.ts` page-object as a
 * function-fixture with the canonical `goToPage(locale?)` +
 * `expectPageVisible(visible?)` paradigm.
 *
 * Reference shape: `candidateQuestionsOverviewPage.fixture.ts:75-89`, locale-
 * aware via `buildRoute({ route: 'Questions', locale })`.
 *
 * Load anchor: `testIds.voter.questions.heading` ('voter-questions-heading') —
 * the pre-existing questions-page heading anchor.
 *
 * NOTE: the Questions route is gated behind voter location (election +
 * constituency selection). A bare `goToPage` from an unlocated session bounces
 * through the selector chain; callers that need a located walk should use the
 * `voter-mega.fixture.ts` traversal helpers. `goToPage` here is for already-
 * located sessions (or deep-link redirect-resume probes).
 *
 * **Rigidity contract** (Phase 88 Plan 04 SCOPE acceptance #6):
 * - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *   `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

export function createVoterQuestionsPage(page: Page) {
  /**
   * Assert the questions page content is (not) visible via its load anchor.
   */
  async function expectPageVisible(visible = true): Promise<void> {
    await expect(page.getByTestId(testIds.voter.questions.heading)).toBeVisible({ visible, timeout: 5_000 });
  }

  return {
    /**
     * Navigate to the voter questions page (locale-aware) and assert it
     * loaded. Requires an already-located voter session.
     */
    async goToPage(locale = 'en'): Promise<void> {
      await page.goto('/' + buildRoute({ route: 'Questions', locale }));
      await expectPageVisible(true);
    },

    expectPageVisible,

    /**
     * Click the questions-intro start button (advances to the first question).
     */
    async clickStart(): Promise<void> {
      await page.getByTestId(testIds.voter.questions.startButton).click();
    }
  };
}

export type VoterQuestionsPageFixture = ReturnType<typeof createVoterQuestionsPage>;
