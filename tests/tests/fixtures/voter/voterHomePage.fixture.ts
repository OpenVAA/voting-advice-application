/**
 * @file voterHomePage fixture.
 *
 * Function-fixture for the voter app front page (`apps/frontend/src/routes/(voters)/+page.svelte`), carrying the canonical `goToPage(locale?)` + `expectPageVisible(visible?)` paradigm.
 *
 * The route is locale-aware via `buildRoute({ route: 'Home', locale })`.
 * Note: `ROUTE.Home` resolves to just the locale segment, so `buildRoute` returns the bare locale (e.g. `'en'`); prepend `/` to form `/en`.
 *
 * Load anchor: `testIds.voter.home.page` ('voter-home') — the always-rendered `MainContent` root content div (NOT `startButton`, which is hidden under the access.voterApp=false maintenance variant).
 *
 * **Rigidity contract**:
 * - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *   `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { buildRoute } from '../../utils/buildRoute';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

export function createVoterHomePage(page: Page) {
  /**
   * Assert the home page content is (not) visible via its load anchor.
   */
  async function expectPageVisible(visible = true): Promise<void> {
    await expect(page.getByTestId(testIds.voter.home.page)).toBeVisible({ visible, timeout: 5_000 });
  }

  return {
    /**
     * Navigate to the voter home page (locale-aware) and assert it loaded.
     */
    async goToPage(locale = 'en'): Promise<void> {
      // buildRoute({route:'Home'}) returns '' (voter ROUTE values carry no [[lang=locale]] token, and the route-group-only Home path collapses to empty). Base locale 'en' is served from '/' (Paraglide); non-base locales are prefixed '/<locale>' (e.g. '/fi').
      await page.goto((locale === 'en' ? '' : `/${locale}`) + buildRoute({ route: 'Home', locale }) || '/');
      await expectPageVisible(true);
    },

    expectPageVisible,

    /**
     * Click the front-page start button (advances to the Intro page).
     */
    async clickStart(): Promise<void> {
      await page.getByTestId(testIds.voter.home.startButton).click();
    }
  };
}

export type VoterHomePageFixture = ReturnType<typeof createVoterHomePage>;
