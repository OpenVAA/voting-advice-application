/**
 * @file voterQuestionsPage fixture.
 *
 * Function-fixture for the voter questions (intro/listing) page
 * (`apps/frontend/src/routes/(voters)/(located)/questions/+page.svelte`),
 * carrying the canonical `goToPage(locale?)` + `expectPageVisible(visible?)`
 * paradigm. Locale-aware via `buildRoute({ route: 'Questions', locale })`.
 *
 * Load anchor: `testIds.voter.questions.heading` ('voter-questions-heading') —
 * the questions-page heading anchor.
 *
 * NOTE: the Questions route is gated behind voter location (election +
 * constituency selection). A bare `goToPage` from an unlocated session bounces
 * through the selector chain; callers that need a located walk should use the
 * `voter-journey.fixture.ts` traversal helpers. `goToPage` here is for already-
 * located sessions (or deep-link redirect-resume probes).
 *
 * **Rigidity contract**:
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
      // buildRoute already returns a leading-slash path (e.g. '/questions') with NO locale
      // segment (voter ROUTE values carry no [[lang=locale]] token). Base locale 'en' is
      // served from '/' (Paraglide); non-base locales are prefixed '/<locale>'.
      await page.goto((locale === 'en' ? '' : `/${locale}`) + buildRoute({ route: 'Questions', locale }) || '/');
      await expectPageVisible(true);
    },

    expectPageVisible,

    /**
     * Click the questions-intro start button (advances to the first question).
     *
     * BYPASS-TOLERANT (Phase 120-01): when `questions.questionsIntro.show ===
     * false` (the minimal perm seeds) the intro page auto-redirects past itself
     * on mount, so the `voter-questions-start` button never paints and the page
     * is ALREADY on the first question (`question-choice` visible). In that case
     * there is nothing to click — return early. When the intro IS shown
     * (`e2e/base`), the start button paints and is clicked as before. See
     * 120-01-PROBE-DIAGNOSIS.md.
     */
    async clickStart(): Promise<void> {
      const start = page.getByTestId(testIds.voter.questions.startButton);
      const alreadyAdvanced = await page
        .getByTestId(testIds.voter.questions.answerOption)
        .first()
        .isVisible()
        .catch(() => false);
      if (alreadyAdvanced) return;
      await start.click();
    }
  };
}

export type VoterQuestionsPageFixture = ReturnType<typeof createVoterQuestionsPage>;
