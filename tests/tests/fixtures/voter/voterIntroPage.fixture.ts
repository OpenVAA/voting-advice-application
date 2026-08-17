/**
 * @file voterIntroPage fixture.
 *
 * Function-fixture for the voter app intro page
 * (`apps/frontend/src/routes/(voters)/intro/+page.svelte`), carrying the
 * canonical `goToPage(locale?)` + `expectPageVisible(visible?)` paradigm.
 * Locale-aware via `buildRoute({ route: 'Intro', locale })`.
 *
 * Load anchor: `testIds.voter.intro.page` ('voter-intro') — the always-rendered
 * `MainContent` root content div (NOT `startButton`, an action).
 *
 * **Rigidity contract**:
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
      // buildRoute already returns a leading-slash path (e.g. '/intro') with NO locale
      // segment (voter ROUTE values carry no [[lang=locale]] token). Base locale 'en' is
      // served from '/' (Paraglide); non-base locales are prefixed '/<locale>'.
      await page.goto((locale === 'en' ? '' : `/${locale}`) + buildRoute({ route: 'Intro', locale }) || '/');
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
