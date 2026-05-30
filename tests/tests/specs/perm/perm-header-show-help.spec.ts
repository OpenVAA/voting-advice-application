/**
 * perm-header-show-help — Phase 91 Plan 02 (TIR6:79-88, A4).
 *
 * `header.showHelp=true` surfaces the help Button in Banner.svelte's top-bar
 * action group (gated on `topBarSettings.current.actions.help === 'show'`).
 * The button's href resolves to `getRoute.current('Help')` which aliases to
 * `${VOTER}/about` per apps/frontend/src/lib/utils/route/route.ts:17.
 *
 * Rigidity contract: no soft assertions, no .catch fallbacks, testid-only.
 *
 * Authoritative spec: TEST-INVENTORY-REFACTOR-6.md:79-88.
 */

import { expect, test } from '@playwright/test';
import { testIds } from '../../utils/testIds';

test.describe('perm-header-show-help', () => {
  test('header-help visible on voter intro; click navigates to /en/about', async ({ page }) => {
    await page.goto('/en');
    const helpBtn = page.getByTestId(testIds.shared.header.help);
    await expect(helpBtn).toBeVisible();
    await helpBtn.click();
    await expect(page).toHaveURL(/\/en\/about/);
  });
});
