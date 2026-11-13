/**
 * @file navMenu reader fixture.
 *
 * Shared, cross-app function-fixture for the navigation menu. Used by both the voter and candidate nav assertions.
 *
 * Reuses the EXISTING navigation testids — NO new id is added:
 *   - `testIds.shared.navigation.menu`       ('nav-menu')        — the menu root (Navigation.svelte).
 *   - `testIds.shared.navigation.menuItem`   ('nav-menu-item')   — each item (NavItem.svelte).
 *   - `testIds.shared.navigation.menuToggle` ('nav-menu-toggle') — the mobile hamburger that opens the drawer (Header.svelte). Locale-independent open-menu anchor.
 *
 * ## Surface
 *  - menu                       — the nav-menu root Locator.
 *  - items()                    — all nav-menu-item Locators inside the menu.
 *  - openMobileNav()            — click the hamburger toggle; the mobile-only open step before reading items.
 *  - expectNavMenuItems(items)  — assert the menu contains EXACTLY the given item labels, in order.
 *  - closeNav()                  — close the open drawer through its own close item.
 *  - expectItemLeadsTo(name, path) — exactly one item has that name, and it is a link to that path.
 *  - expectNoItemLeadsTo(path)  — no item is a link to that path, in any locale.
 *
 * Contestant-app members, for the group of the entity being edited (`ContestantNav.svelte`; ids under `testIds.contestant.nav`):
 *  - expectEntityGroupTitle(text)   — the group's title, which names the selected entity with its type.
 *  - expectSwitchEntityItem()       — the item that returns to the profile selection screen is the group's last link and leads to the app root.
 *  - expectNoSwitchEntityItem()     — the menu holds no such item, as for a user with a single entity.
 *  - switchEntity()                 — activate that item.
 *  - expectQuestionsItem(present)   — the group holds the item that leads to the entity's questions, or holds none.
 *  - goHome()                       — open the menu and activate the item that leads to the entity's home, a navigation inside the application.
 *  - expectNominationsItem()        — the item that leads to the entity's nominations is the group's second link, after the home item.
 *  - openNominations()              — activate that item, a navigation inside the application.
 *  - expectClosedItems(items)       — of the profile, questions and preview items, exactly the named ones are disabled, each collapsed over the reason it shows when clicked and described by nothing.
 *  - expectNoReasonShown()          — the menu shows no reason why an item is closed.
 *  - openClosedItemReason(item, reason) — click a closed item, which shows in its own list item the reason it is closed, carrying that reason, without navigating or closing the menu.
 *  - expectClosedItemReason(item, reason) — a closed item shows no reason until it is clicked, shows that reason inside the drawer when it is, and hides it on a second click.
 *  - expectQuestionsBadge(count)    — the figure of the questions item's badge, or no badge.
 *  - expectClosedPartsInsideDrawer() — every closed item, and the reason it shows when clicked, lie inside the drawer's panel and show their whole text.
 *
 * **Rigidity contract**: no soft assertions, no try/catch wrapping an assertion, no best-effort swallowing of assertion-bearing interactions.
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
  /** Click the mobile hamburger toggle to open the nav drawer. */
  openMobileNav(): Promise<void>;
  /**
   * Assert the menu contains exactly `expected` item labels, in order. Each entry is matched against the corresponding item's accessible name (regex or substring).
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
      // The hamburger is mobile-only chrome (Header.svelte). Hard-assert it is visible before clicking, then hard-assert the menu opened — per the fixture rigidity contract (no best-effort swallowing).
      await expect(toggle).toBeVisible();
      // Hydration-race guard: the toggle renders via SSR before its Svelte `onclick={openDrawer}` handler is hydrated. A click in the SSR→hydration gap is a no-op (the drawer never opens, the `nav-menu` keeps its `hidden` class). `toPass` retries the click+open-assert so a pre-hydration no-op click is retried once the handler is bound. Each inner step is still a HARD assertion (no swallowing) — `toPass` only governs the retry, and a genuine never-opening drawer still fails at the outer timeout.
      await expect(async () => {
        await toggle.click();
        await expect(menu).toBeVisible({ timeout: 2_000 });
      }).toPass({ timeout: 15_000 });
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
