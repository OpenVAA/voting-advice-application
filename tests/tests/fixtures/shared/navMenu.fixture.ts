/**
 * @file navMenu reader fixture (EFLOW-09 / EFLOW-11).
 *
 * Shared, cross-app function-fixture for the navigation menu. Used by both the
 * voter and candidate nav assertions.
 *
 * Reuses the EXISTING navigation testids — NO new id is added:
 *   - `testIds.shared.navigation.menu`       ('nav-menu')        — the menu root
 *     (Navigation.svelte).
 *   - `testIds.shared.navigation.menuItem`   ('nav-menu-item')   — each item
 *     (NavItem.svelte).
 *   - `testIds.shared.navigation.menuToggle` ('nav-menu-toggle') — the mobile
 *     hamburger that opens the drawer (Header.svelte). Locale-independent
 *     open-menu anchor.
 *
 * ## Surface
 *  - menu                       — the nav-menu root Locator.
 *  - items()                    — all nav-menu-item Locators inside the menu.
 *  - openMobileNav()            — click the hamburger toggle (EFLOW-11); the
 *                                 mobile-only open step before reading items.
 *  - expectNavMenuItems(items)  — assert the menu contains EXACTLY the given
 *                                 item labels, in order (EFLOW-09).
 *
 * **Rigidity contract**: no soft assertions, no try/catch wrapping an
 * assertion, no best-effort swallowing of assertion-bearing interactions.
 * All locators are testid-anchored (locale-resilient).
 */

import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export interface NavMenuFixture {
  /** The nav-menu root Locator. */
  readonly menu: Locator;
  /** All nav-menu-item Locators inside the menu. */
  items(): Locator;
  /** Click the mobile hamburger toggle to open the nav drawer (EFLOW-11). */
  openMobileNav(): Promise<void>;
  /**
   * Assert the menu contains exactly `expected` item labels, in order
   * (EFLOW-09). Each entry is matched against the corresponding item's
   * accessible name (regex or substring).
   */
  expectNavMenuItems(expected: Array<RegExp | string>): Promise<void>;
}

/**
 * Create the nav-menu reader bound to `page`.
 */
export function createNavMenu(page: Page): NavMenuFixture {
  const menu = page.getByTestId(testIds.shared.navigation.menu);
  const toggle = page.getByTestId(testIds.shared.navigation.menuToggle);

  return {
    menu,

    items(): Locator {
      return menu.getByTestId(testIds.shared.navigation.menuItem);
    },

    async openMobileNav(): Promise<void> {
      // The hamburger is mobile-only chrome (Header.svelte). Hard-assert it is
      // visible before clicking, then hard-assert the menu opened — per the
      // fixture rigidity contract (no best-effort swallowing).
      await expect(toggle).toBeVisible();
      await toggle.click();
      await expect(menu).toBeVisible();
    },

    async expectNavMenuItems(expected: Array<RegExp | string>): Promise<void> {
      const items = this.items();
      await expect(items).toHaveCount(expected.length);
      for (let i = 0; i < expected.length; i++) {
        await expect(items.nth(i)).toHaveAccessibleName(expected[i]);
      }
    }
  };
}
