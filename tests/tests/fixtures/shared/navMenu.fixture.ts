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
import { createPageGeometry } from './pageGeometry.fixture';
import { escapeRegExp } from '../../../../apps/frontend/src/lib/utils/regexp';
import { TIMEOUTS } from '../../helpers';
import { contestantAppRootUrlRe, contestantUrlRe } from '../../utils/contestantEntityUrl';
import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

/** The items of the contestant menu that are closed while the entity cannot open their pages. */
export type ContestantNavClosableItem = 'profile' | 'questions' | 'preview';

/** Why items of the contestant menu are closed, as the `data-reason` of the reason a closed item shows says it. */
export type ContestantNavClosedReason = 'noNomination' | 'previewNotReady';

/** Every item of the contestant menu that can be closed, in the order the menu lists them. */
const CLOSABLE_ITEMS: ReadonlyArray<ContestantNavClosableItem> = ['profile', 'questions', 'preview'];

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
  /** Close the open nav drawer through its close item, the menu's first item. */
  closeNav(): Promise<void>;
  /**
   * Assert that exactly one item of the open menu has the accessible name `name`, and that it is a link to `path`: the path as the tests' route builder writes it, with or without the base locale's prefix, and nothing after it.
   */
  expectItemLeadsTo(name: string, path: string): Promise<void>;
  /** Assert that no item of the open menu is a link to `path`, under any locale prefix and whatever query follows it. */
  expectNoItemLeadsTo(path: string): Promise<void>;
  /** Assert the title of the contestant menu's entity group, which names the selected entity with its type. */
  expectEntityGroupTitle(expected: RegExp | string): Promise<void>;
  /** Assert the contestant menu's switch item is visible, is the last link of the entity group and leads to the app root. */
  expectSwitchEntityItem(): Promise<void>;
  /** Assert the contestant menu holds no switch item. */
  expectNoSwitchEntityItem(): Promise<void>;
  /** Activate the contestant menu's switch item. */
  switchEntity(): Promise<void>;
  /** Assert the contestant menu's entity group holds the item that leads to the entity's questions, or holds none. */
  expectQuestionsItem(present: boolean): Promise<void>;
  /** Open the menu and activate the contestant menu's home item. The click is a navigation inside the application and loads no new document. */
  goHome(): Promise<void>;
  /** Assert the contestant menu's nominations item is visible, is the second link of the entity group, after the home item, and leads to the entity's nominations. */
  expectNominationsItem(): Promise<void>;
  /** Activate the contestant menu's nominations item. The click is a navigation inside the application and loads no new document. */
  openNominations(): Promise<void>;
  /**
   * Assert which of the contestant menu's profile, questions and preview items are closed: each item in `items` is disabled, collapsed over the reason it shows when clicked and described by nothing, and each of the three that is not in `items` is enabled. The link target of a closed item is not read: it has none.
   */
  expectClosedItems(items: ReadonlyArray<ContestantNavClosableItem>): Promise<void>;
  /** Assert that the contestant menu shows no reason why an item is closed. */
  expectNoReasonShown(): Promise<void>;
  /**
   * Click the closed contestant menu item `name`, which shows no reason and is collapsed until then, and assert that it then shows, in its own list item and inside the region it controls, the sentence that says why it is closed, carrying `reason`. The click loads no page and leaves the menu open. The reason stays shown.
   */
  openClosedItemReason(name: ContestantNavClosableItem, reason: ContestantNavClosedReason): Promise<void>;
  /**
   * Assert that the closed contestant menu item `name` shows why it is closed only when asked: no reason before a click, the reason carrying `reason` after it, wholly inside the drawer's panel, and none again after a second click.
   */
  expectClosedItemReason(name: ContestantNavClosableItem, reason: ContestantNavClosedReason): Promise<void>;
  /** Assert the figure the badge of the contestant menu's questions item shows, or, for `null`, that the item has no badge. */
  expectQuestionsBadge(count: number | null): Promise<void>;
  /**
   * Assert that each of the contestant menu's closed items, and the reason it shows once clicked, lie wholly inside the box of the drawer's panel, and that none of them holds text that reaches beyond its own box. The drawer clips what does not fit instead of widening the page, so the page's width does not show it. Each reason is hidden again after it is measured. The menu must hold a closed item.
   */
  expectClosedPartsInsideDrawer(): Promise<void>;
}

/**
 * Create the nav-menu reader bound to `page`.
 */
export function createNavMenu(page: Page): NavMenuFixture {
  const menu = page.getByTestId(testIds.shared.navigation.menu);
  const toggle = page.getByTestId(testIds.shared.navigation.menuToggle);
  const entityGroup = menu.getByTestId(testIds.contestant.nav.entityGroup);
  const switchItem = menu.getByTestId(testIds.contestant.nav.switchEntity);
  const nominationsItem = entityGroup.getByTestId(testIds.contestant.nav.nominations);
  const closedReason = menu.getByTestId(testIds.contestant.nav.closedReason);
  const geometry = createPageGeometry(page);
  /** The list item of the entity group that holds the item `name`. The item inside `has` is found from the list item, so it is not anchored on the menu. */
  const rowOf = (name: ContestantNavClosableItem): Locator =>
    entityGroup.getByRole('listitem').filter({ has: page.getByTestId(testIds.contestant.nav[name]) });

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
    },

    async closeNav(): Promise<void> {
      // The drawer's close item is the first `nav-menu-item` of every menu. The Escape key does not close the drawer.
      await this.items().first().click();
      await expect(menu).toBeHidden();
    },

    async expectItemLeadsTo(name: string, path: string): Promise<void> {
      const item = this.items().and(menu.getByRole('link', { name, exact: true }));
      await expect(item).toHaveCount(1);
      await expect(item).toHaveAttribute('href', new RegExp(`^(?:/en)?${escapeRegExp(path)}$`));
    },

    async expectNoItemLeadsTo(path: string): Promise<void> {
      await expect(menu).toBeVisible();
      const paths = await this.items().evaluateAll((items) =>
        items
          .map((item) => item.getAttribute('href'))
          .map((href) => (href === null ? null : new URL(href, document.baseURI).pathname))
      );
      const leadingThere = new RegExp(`^(?:/[a-z]{2})?${escapeRegExp(path)}/?$`);
      expect(
        paths.filter((itemPath) => itemPath !== null && leadingThere.test(itemPath)),
        `menu items that lead to ${path}`
      ).toEqual([]);
    },

    async expectEntityGroupTitle(expected: RegExp | string): Promise<void> {
      await expect(entityGroup.getByRole('heading')).toHaveText(expected);
    },

    async expectSwitchEntityItem(): Promise<void> {
      await expect(switchItem).toBeVisible();
      await expect(switchItem).toHaveAttribute('href', contestantAppRootUrlRe());
      // The group's links are selected by role: a selector on the `contestant-nav-` id prefix would also match the group's own <section>.
      await expect(entityGroup.getByRole('link').last()).toHaveAttribute(
        'data-testid',
        testIds.contestant.nav.switchEntity
      );
    },

    async expectNoSwitchEntityItem(): Promise<void> {
      await expect(menu).toBeVisible();
      await expect(switchItem).toHaveCount(0);
    },

    async switchEntity(): Promise<void> {
      await switchItem.click();
    },

    async expectQuestionsItem(present: boolean): Promise<void> {
      // The profile item stands beside the questions item wherever the URL names an entity, so an absent questions item is not that of a menu without its entity group.
      await expect(menu.getByTestId(testIds.contestant.nav.profile)).toBeVisible({ timeout: TIMEOUTS.page });
      const item = menu.getByTestId(testIds.contestant.nav.questions);
      if (present) await expect(item).toBeVisible({ timeout: TIMEOUTS.page });
      else await expect(item).toHaveCount(0, { timeout: TIMEOUTS.page });
    },

    async goHome(): Promise<void> {
      await this.openMobileNav();
      await menu.getByTestId(testIds.contestant.nav.home).click({ timeout: TIMEOUTS.page });
    },

    async expectNominationsItem(): Promise<void> {
      await expect(nominationsItem).toBeVisible({ timeout: TIMEOUTS.page });
      await expect(nominationsItem).toHaveAttribute('href', contestantUrlRe('/nominations'));
      // The group's links are selected by role, as in `expectSwitchEntityItem`. A closed item is a link too, so the order read is the menu's own.
      const links = entityGroup.getByRole('link');
      await expect(links.nth(0)).toHaveAttribute('data-testid', testIds.contestant.nav.home);
      await expect(links.nth(1)).toHaveAttribute('data-testid', testIds.contestant.nav.nominations);
    },

    async openNominations(): Promise<void> {
      await nominationsItem.click({ timeout: TIMEOUTS.page });
    },

    async expectClosedItems(items: ReadonlyArray<ContestantNavClosableItem>): Promise<void> {
      for (const name of CLOSABLE_ITEMS) {
        const item = menu.getByTestId(testIds.contestant.nav[name]);
        await expect(item).toBeVisible({ timeout: TIMEOUTS.page });
        if (!items.includes(name)) {
          await expect(item).toBeEnabled({ timeout: TIMEOUTS.page });
          continue;
        }
        await expect(item).toBeDisabled({ timeout: TIMEOUTS.page });
        await expect(item).toHaveAttribute('aria-expanded', 'false', { timeout: TIMEOUTS.page });
        await expect(item).not.toHaveAttribute('aria-describedby');
      }
    },

    async expectNoReasonShown(): Promise<void> {
      // The preview item stands in every menu that could show a reason, so an absent reason is not that of a menu without its entity group.
      await expect(menu.getByTestId(testIds.contestant.nav.preview)).toBeVisible({ timeout: TIMEOUTS.page });
      await expect(closedReason).toHaveCount(0, { timeout: TIMEOUTS.page });
    },

    async openClosedItemReason(name: ContestantNavClosableItem, reason: ContestantNavClosedReason): Promise<void> {
      const item = menu.getByTestId(testIds.contestant.nav[name]);
      const row = rowOf(name);
      const shown = row.getByTestId(testIds.contestant.nav.closedReason);
      await expect(item).toBeDisabled({ timeout: TIMEOUTS.page });
      await expect(item).toHaveAttribute('aria-expanded', 'false', { timeout: TIMEOUTS.page });
      await expect(shown).toHaveCount(0);
      const address = page.url();
      await expect(item).toBeVisible({ timeout: TIMEOUTS.page });
      // reason: Playwright waits for an `aria-disabled` element to become enabled before it clicks; this one is operable while it says it is unavailable, so the click is made without that wait. It is visible, as asserted above.
      // eslint-disable-next-line playwright/no-force-option
      await item.click({ force: true, timeout: TIMEOUTS.page });
      await expect(item).toHaveAttribute('aria-expanded', 'true', { timeout: TIMEOUTS.page });
      await expect(shown).toBeVisible({ timeout: TIMEOUTS.page });
      await expect(shown).toHaveAttribute('data-reason', reason);
      const sentence = ((await shown.textContent()) ?? '').replace(/\s+/g, ' ').trim();
      expect(sentence, 'the shown reason holds text').not.toBe('');
      // The reason is in the item's live region, which the item names as the region it controls.
      const region = row.getByRole('status');
      await expect(region.getByTestId(testIds.contestant.nav.closedReason)).toBeVisible();
      await expect(region).toHaveAttribute('id', /.+/);
      await expect(item, 'the item controls the region that shows its reason').toHaveAttribute(
        'aria-controls',
        (await region.getAttribute('id')) ?? ''
      );
      await expect(menu, 'the click leaves the menu open').toBeVisible();
      expect(page.url(), 'the click loads no page').toBe(address);
    },

    async expectClosedItemReason(name: ContestantNavClosableItem, reason: ContestantNavClosedReason): Promise<void> {
      const item = menu.getByTestId(testIds.contestant.nav[name]);
      const shown = rowOf(name).getByTestId(testIds.contestant.nav.closedReason);
      await this.openClosedItemReason(name, reason);
      await geometry.expectInside(shown, menu, `the reason the ${name} item shows`);
      await geometry.expectShowsWholeText(shown, `the reason the ${name} item shows`);
      // The second activation is made with the keyboard, which reaches the item as a tab stop does.
      await item.press('Enter', { timeout: TIMEOUTS.page });
      await expect(item).toHaveAttribute('aria-expanded', 'false', { timeout: TIMEOUTS.page });
      await expect(shown).toHaveCount(0, { timeout: TIMEOUTS.page });
    },

    async expectQuestionsBadge(count: number | null): Promise<void> {
      const item = menu.getByTestId(testIds.contestant.nav.questions);
      await expect(item).toBeVisible({ timeout: TIMEOUTS.page });
      // The badge carries no id of its own: it is the element of the item with the component library's badge class.
      await expect
        .poll(() => item.evaluate((element) => element.querySelector('.badge')?.textContent?.trim() ?? null), {
          timeout: TIMEOUTS.page
        })
        .toBe(count === null ? null : String(count));
    },

    async expectClosedPartsInsideDrawer(): Promise<void> {
      await expect(menu).toBeVisible({ timeout: TIMEOUTS.page });
      // A closed item says it is disabled, whether it is a button that shows its reason or a link whose reason is not known. Each one the menu holds is measured, and the reason it shows with it.
      const closedItems = entityGroup
        .getByRole('button', { disabled: true })
        .or(entityGroup.getByRole('link', { disabled: true }));
      expect(await closedItems.count(), 'the menu holds a closed item').toBeGreaterThan(0);
      for (const name of CLOSABLE_ITEMS) {
        const item = menu.getByTestId(testIds.contestant.nav[name]);
        if ((await item.count()) === 0 || (await item.getAttribute('aria-disabled')) !== 'true') continue;
        await geometry.expectInside(item, menu, `the closed ${name} item`);
        await geometry.expectShowsWholeText(item, `the closed ${name} item`);
        if ((await item.getAttribute('aria-expanded')) === null) continue;
        const shown = rowOf(name).getByTestId(testIds.contestant.nav.closedReason);
        await expect(item).toBeVisible({ timeout: TIMEOUTS.page });
        // reason: clicked without Playwright's wait for an enabled element, for the reason given at `openClosedItemReason`.
        // eslint-disable-next-line playwright/no-force-option
        await item.click({ force: true, timeout: TIMEOUTS.page });
        await expect(shown).toBeVisible({ timeout: TIMEOUTS.page });
        await geometry.expectInside(shown, menu, `the reason the ${name} item shows`);
        await geometry.expectShowsWholeText(shown, `the reason the ${name} item shows`);
        await item.press('Enter', { timeout: TIMEOUTS.page });
        await expect(shown).toHaveCount(0, { timeout: TIMEOUTS.page });
      }
    }
  };
}
