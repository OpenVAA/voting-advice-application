/**
 * @file voterIntroPage fixture — Phase 92 Plan 03 (WS2 FIXTURES, D-06/D-07/D-08).
 *
 * Function-fixture for the voter app intro page
 * (`apps/frontend/src/routes/(voters)/intro/+page.svelte`). Rebuilds the
 * deleted `pages/voter/IntroPage.ts` page-object as a function-fixture with
 * the canonical `goToPage(locale?)` + `expectPageVisible(visible?)` paradigm.
 *
 * Reference shape: `candidateQuestionsOverviewPage.fixture.ts:75-89`, locale-
 * aware via `buildRoute({ route: 'Intro', locale })`.
 *
 * Load anchor: `testIds.voter.intro.page` ('voter-intro') — the always-rendered
 * `MainContent` root content div (NOT `startButton`, an action).
 *
 * **Rigidity contract** (Phase 88 Plan 04 SCOPE acceptance #6):
 * - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *   `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

export function createVoterIntroPage(page: Page) {
  /**
   * Assert the intro page content is (not) visible via its load anchor.
   */
  async function expectPageVisible(visible = true): Promise<void> {
    await expect(page.getByTestId(testIds.voter.intro.page)).toBeVisible({ visible, timeout: 5_000 });
  }

  return {
    /**
     * Navigate to the voter intro page (locale-aware) and assert it loaded.
     */
    async goToPage(locale = 'en'): Promise<void> {
      await page.goto('/' + buildRoute({ route: 'Intro', locale }));
      await expectPageVisible(true);
    },

    expectPageVisible,

    /**
     * Click the intro continue/start button (advances to elections or
     * constituencies depending on `elections.startFromConstituencyGroup`).
     */
    async clickStart(): Promise<void> {
      await page.getByTestId(testIds.voter.intro.startButton).click();
    }
  };
}

export type VoterIntroPageFixture = ReturnType<typeof createVoterIntroPage>;
