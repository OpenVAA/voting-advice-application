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
import type { Page } from '@playwright/test';
import type { LangSelectorFixture } from './langSelectorFixture.fixture';

export function createVoterNav(page: Page) {
  return {
    /**
     * Open the voter nav drawer (idempotent) and return a LangSelectorFixture
     * scoped to the now-open drawer. If the drawer is already open, the toggle
     * click is skipped.
     *
     * Hydration-race hardening: the menu-toggle is rendered server-side, but its
     * Svelte `onclick={openDrawer}` handler (Layout.svelte:49) is only bound once
     * the page hydrates. A single `.click()` fired before hydration completes is
     * a silent no-op — the drawer never opens and the bare `expect(menu).toBeVisible()`
     * times out (the observed flake). `openDrawer()` ONLY sets `isDrawerOpen = true`
     * (it never toggles closed), so re-clicking is safe; retry the click via
     * `toPass()` until the drawer nav actually becomes visible.
     */
    async open(): Promise<LangSelectorFixture> {
      const menu = page.getByTestId(testIds.shared.navigation.menu);
      const toggle = page.getByTestId(testIds.shared.navigation.menuToggle);
      // Wait for the toggle to be actionable (page chrome rendered) before
      // attempting to interact — fail fast with a clear locator if it never shows.
      await expect(toggle).toBeVisible();
      await expect(async () => {
        if (!(await menu.isVisible())) {
          await toggle.click();
        }
        // Short per-attempt budget: if this click registered, the drawer opens
        // well within 1s; if it was a pre-hydration no-op, toPass re-clicks.
        await expect(menu).toBeVisible({ timeout: 1000 });
      }).toPass({ timeout: 10_000 });
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
      // reason: the close control's accessible name (t('common.closeMenu'))
      // is locale-dependent, so a getByRole({ name }) selector would not be
      // locale-independent. The `#drawerCloseButton` id (VoterNav.svelte:57)
      // is the only locale-stable anchor for this control.
      // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
      await page.locator('#drawerCloseButton').click();
      await expect(menu).toBeHidden();
    }
  };
}

export type VoterNavFixture = ReturnType<typeof createVoterNav>;
