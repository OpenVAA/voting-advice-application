/**
 * @file voterNavFixture — Phase quick-260601-iqd.
 *
 * Function-fixture for the voter nav drawer (Header.svelte menu-toggle +
 * VoterNav.svelte). The LanguageSelection NavGroup (consumed by
 * langSelectorFixture) renders ONLY inside this drawer, which is closed by
 * default. This fixture exposes a locale-independent open/close pair so specs
 * can reach the language selector in any UI locale.
 *
 * Surface:
 *  - open()   — idempotent. If the drawer nav is already visible, skip the
 *               click; otherwise click the locale-independent menu-toggle
 *               (testIds.shared.navigation.menuToggle) and wait for the drawer
 *               nav (testIds.shared.navigation.menu) to be visible. Returns a
 *               `LangSelectorFixture` so callers can chain language-selection
 *               ops on the now-open drawer.
 *  - close()  — idempotent. If the drawer nav is not visible, return early;
 *               otherwise click the locale-independent close control
 *               (`#drawerCloseButton`, VoterNav.svelte:57) and wait for the
 *               drawer nav to be hidden.
 *
 * The menu-toggle is targeted by a stable testid rather than the English-only
 * `/open menu/i` aria-label — on the /fi locale that regex does not match.
 * The close control uses the locale-independent `#drawerCloseButton` id.
 *
 * **Rigidity contract** (TIR5:5-13 + Phase 88 lineage):
 *  - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *    `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { createLangSelector } from './langSelectorFixture.fixture';
import { testIds } from '../../utils/testIds';
import type { LangSelectorFixture } from './langSelectorFixture.fixture';
import type { Page } from '@playwright/test';

export function createVoterNav(page: Page) {
  return {
    /**
     * Open the voter nav drawer (idempotent) and return a LangSelectorFixture
     * scoped to the now-open drawer. If the drawer is already open, the toggle
     * click is skipped.
     */
    async open(): Promise<LangSelectorFixture> {
      const menu = page.getByTestId(testIds.shared.navigation.menu);
      if (!(await menu.isVisible())) {
        await page.getByTestId(testIds.shared.navigation.menuToggle).click();
        await expect(menu).toBeVisible();
      }
      return createLangSelector(page);
    },

    /**
     * Close the voter nav drawer (idempotent). If the drawer is not visible,
     * return early. The close control is the locale-independent
     * `#drawerCloseButton` (VoterNav.svelte:57).
     */
    async close(): Promise<void> {
      const menu = page.getByTestId(testIds.shared.navigation.menu);
      if (!(await menu.isVisible())) {
        return;
      }
      await page.locator('#drawerCloseButton').click();
      await expect(menu).toBeHidden();
    }
  };
}

export type VoterNavFixture = ReturnType<typeof createVoterNav>;
