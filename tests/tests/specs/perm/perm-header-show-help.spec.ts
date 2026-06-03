/**
 * perm-header-show-help — Phase 91 Plan 02 (TIR6:79-88, A4).
 *
 * `header.showHelp=true` surfaces the help Button in Banner.svelte's top-bar
 * action group (gated on `topBarSettings.current.actions.help === 'show'`).
 * The button's href resolves to `getRoute.current('Help')` which aliases to
 * `${VOTER}/about` per apps/frontend/src/lib/utils/route/route.ts:17.
 *
 * URL assertion is locale-agnostic: the base locale (`en`) is served WITHOUT a
 * `/en/` prefix (Paraglide urlPatterns — see perm-localisation-positive:162-164),
 * so navigation lands on `/about`, not `/en/about`. The matcher tolerates an
 * optional locale segment so it holds for both base- and prefixed-locale runs.
 *
 * Rigidity contract: no soft assertions, no .catch fallbacks, testid-only.
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-6.md:79-88.
 */

import { expect, test } from '../../fixtures/voter/views';
import { testIds } from '../../utils/testIds';

test.describe('perm-header-show-help', () => {
  test('header-help visible on voter intro; click navigates to About', async ({ page, voterHomePage }) => {
    await voterHomePage.goToPage('en');
    const helpBtn = page.getByTestId(testIds.shared.header.help);
    await expect(helpBtn).toBeVisible();
    await helpBtn.click();
    // Optional `/<locale>` segment, then `/about`. Base locale (en) is prefixless.
    await expect(page).toHaveURL(/\/(?:[a-z]{2}\/)?about(?:\/|$)/);
  });
});
