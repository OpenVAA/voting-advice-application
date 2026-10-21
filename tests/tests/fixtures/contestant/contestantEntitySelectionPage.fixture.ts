/**
 * @file contestantEntitySelectionPage fixture.
 *
 * Function-fixture for the profile selection screen: the Contestant App's root as a user who edits several entities sees it (`apps/frontend/src/routes/contestant/(protected)/+page.svelte`, the `select` view). One group per entity type, candidates first; each entity is a card with its type label, linking to that entity's home.
 *
 * The screen shows a loading indicator on the first client frame of every visit, so every reader here waits for a card before it reads.
 *
 * Surface:
 *  - open()                    — navigate to the app root and wait for the screen.
 *  - requestAppRootExpectingRedirect() — navigate to the app root and assert the server answered with a redirect, so the screen was never rendered.
 *  - expectShown()             — the URL is the app root and the list holds at least one card.
 *  - expectAbsent()            — the list is not in the DOM.
 *  - expectHeadingFocused()    — keyboard focus is on the page heading.
 *  - readView()                — everything the screen shows, as plain data: the heading, the groups in DOM order with their headings and cards, and the number of alerts.
 *  - expectCardLinksTo(title, href) — the card with that title links to that path.
 *  - pick(title)               — activate the card with exactly that title.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import { buildRoute } from '../../utils/buildRoute';
import { contestantAppRootUrlRe } from '../../utils/contestantEntityUrl';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

/** One card of the selection screen. */
export interface EntitySelectionCard {
  /** The entity's displayed name. */
  title: string;
  /** The card's type label, e.g. "candidate". */
  typeLabel: string;
}

/** One group of the selection screen. */
export interface EntitySelectionGroup {
  /** The entity type the group lists, from its `data-entity-type` attribute. */
  entityType: string | null;
  /** The group's heading, or `null` when the screen shows no group headings. */
  heading: string | null;
  /** The group's cards in DOM order. */
  cards: Array<EntitySelectionCard>;
}

/** Everything the selection screen shows. */
export interface EntitySelectionView {
  /** The page heading. */
  heading: string;
  /** The groups in DOM order. */
  groups: Array<EntitySelectionGroup>;
  /** How many alerts the page holds: a notice or an error message would be one. */
  alertCount: number;
}

export function createContestantEntitySelectionPage(page: Page) {
  const list = page.getByTestId(testIds.contestant.entitySelection.list);
  const groups = list.getByTestId(testIds.contestant.entitySelection.group);
  const cards = list.getByTestId(testIds.voter.results.card);
  const mainHeading = page.getByRole('heading', { level: 1 });

  /** The link of the card whose title is exactly `title`. */
  function cardAction(title: string) {
    return list
      .getByTestId(testIds.voter.results.cardAction)
      .filter({ has: page.getByRole('heading', { name: title, exact: true }) });
  }

  return {
    /**
     * Navigate to the app root and wait for the selection screen.
     */
    async open(): Promise<void> {
      await page.goto(buildRoute({ route: 'ContestantAppHome', locale: 'en' }));
      await this.expectShown();
    },

    /**
     * Navigate to the app root and assert that the document the browser ended on was reached through a redirect from it. A redirect is answered by the server before any page renders, so the selection screen was at no point in the DOM.
     */
    async requestAppRootExpectingRedirect(): Promise<void> {
      const response = await page.goto(buildRoute({ route: 'ContestantAppHome', locale: 'en' }));
      expect(response?.request().redirectedFrom()?.url()).toMatch(contestantAppRootUrlRe());
      await expect(page).not.toHaveURL(contestantAppRootUrlRe());
    },

    /**
     * Assert the selection screen is shown: the URL is the app root and the list holds a card.
     */
    async expectShown(): Promise<void> {
      await expect(page).toHaveURL(contestantAppRootUrlRe());
      await expect(cards.first()).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Assert the selection list is not in the DOM.
     */
    async expectAbsent(): Promise<void> {
      await expect(list).toHaveCount(0);
    },

    /**
     * Assert keyboard focus is on the page heading.
     */
    async expectHeadingFocused(): Promise<void> {
      await expect(mainHeading).toBeFocused();
    },

    /**
     * Read everything the screen shows, once a card has rendered.
     */
    async readView(): Promise<EntitySelectionView> {
      await expect(cards.first()).toBeVisible({ timeout: TIMEOUTS.slowPage });
      const view: EntitySelectionView = {
        heading: ((await mainHeading.textContent()) ?? '').trim(),
        groups: [],
        alertCount: await page.getByRole('alert').count()
      };
      for (const group of await groups.all()) {
        const headings = await group.getByTestId(testIds.contestant.entitySelection.groupHeading).allTextContents();
        const titles = await group.getByTestId(testIds.voter.results.cardTitle).allTextContents();
        const typeLabels = await group.getByTestId(testIds.voter.results.cardType).allTextContents();
        view.groups.push({
          entityType: await group.getAttribute('data-entity-type'),
          heading: headings.length > 0 ? headings[0].trim() : null,
          cards: titles.map((title, i) => ({ title: title.trim(), typeLabel: (typeLabels[i] ?? '').trim() }))
        });
      }
      return view;
    },

    /**
     * Assert the card with exactly `title` links to `href`.
     */
    async expectCardLinksTo(title: string, href: string): Promise<void> {
      await expect(cardAction(title)).toHaveAttribute('href', href);
    },

    /**
     * Activate the card with exactly `title`.
     */
    async pick(title: string): Promise<void> {
      await cardAction(title).click();
    }
  };
}

export type ContestantEntitySelectionPageFixture = ReturnType<typeof createContestantEntitySelectionPage>;
