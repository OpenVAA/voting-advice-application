/**
 * @file organizationDetail fixture.
 *
 * Function-fixture for what an anonymous voter sees of an organization: its card in the results' list of organizations, and its detail opened from that card. It composes the voter walk (`voter-journey.fixture.ts`) and the results page fixture (`resultsPage.fixture.ts`) and adds no other way through the app.
 *
 * The results show a tab per entity type only when more than one type has a nomination the voter can see. With organizations alone their list is the page's only one and there is no tab to select, so the fixture selects the tab when the list is not already the one shown.
 *
 * Surface:
 *  - openList()                              — walk a voter through the questions to the results and show the list of organizations.
 *  - reloadList()                            — reload the results, as a voter who refreshes the page, and show the list again.
 *  - openListed(name)                        — open the detail of the organization whose card of the shown list matches `name`.
 *  - openFromResults(name)                   — `openList()`, then `openListed(name)`.
 *  - expectListed(name)                      — exactly one card of the list matches `name`.
 *  - expectNotListed(name)                   — the list holds a card, and none matches `name`.
 *  - expectName(name)                        — the open detail's header shows `name`.
 *  - expectInfoAnswer(questionText, value)   — the open detail's info tab shows the organization's answer to an info question.
 *  - expectOpinionAnswer(questionText, opts) — the open detail's opinions tab marks the organization's answer to an opinion question.
 *  - expectAvatarInitials(text)              — the open detail's avatar shows initials, and they are `text`.
 *  - expectAvatarColor({ not })              — the open detail's avatar is painted with a colour, and not with the one named.
 *  - expectAvatarImage()                     — the open detail's avatar shows a loaded image.
 *
 * The avatar carries no test id. It is the figure of the detail's card header, which is the first figure of the detail: the header comes before every tab's content.
 *
 * Every matcher is the caller's: the fixture holds no name of any dataset.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { TAB_LABELS } from './entityDetails.fixture';
import { createResultsPage } from './resultsPage.fixture';
import { answerAndAdvanceToResults, walkUntilQuestionsIntro } from './voter-journey.fixture';
import { escapeRegExp } from '../../../../apps/frontend/src/lib/utils/regexp';
import { TIMEOUTS } from '../../helpers';
import { testIds } from '../../utils/testIds';
import type { Page } from '@playwright/test';

/** A six-digit hex colour, the one form an avatar's colour property holds. */
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/** The text of the marker the detail puts beside the choice an entity selected. It is read by a screen reader as part of that choice's name. */
const ENTITY_SELECTED_MARKER = 'entity-selected';

/**
 * A hex colour in the `rgb(r, g, b)` form in which a browser reports a computed colour.
 * @param hex - A colour as `#rrggbb`, in either case.
 * @throws If `hex` is not a six-digit hex colour.
 */
function hexToRgb(hex: string): string {
  if (!HEX_COLOR.test(hex)) throw new Error(`organizationDetail: "${hex}" is not a colour of the form #rrggbb`);
  const channel = (start: number): number => parseInt(hex.slice(start, start + 2), 16);
  return `rgb(${channel(1)}, ${channel(3)}, ${channel(5)})`;
}

/**
 * Create the fixture for an organization as an anonymous voter finds it in the results.
 *
 * @param page - The page the fixture drives. It walks the voter flow from the home page, so the page carries no voter state before `openList` or `openFromResults`.
 * @returns The fixture's steps.
 */
export function createOrganizationDetail(page: Page) {
  const resultsPage = createResultsPage(page);
  const organizationList = page.getByTestId(testIds.voter.results.partySection);
  const organizationCards = organizationList.getByTestId(testIds.voter.results.card);
  const detail = page.getByTestId(testIds.voter.results.entityDetails);
  /** The avatar of the open detail: the figure of its card header. */
  const avatar = detail.getByRole('figure').first();

  /**
   * Walk an anonymous voter from the home page through every question to the results, and show the list of organizations.
   */
  async function openList(): Promise<void> {
    await walkUntilQuestionsIntro(page);
    await answerAndAdvanceToResults(page, 'max');
    // The walk returns once the results list has rendered, so which list is shown is settled: the organizations' when it is the only one, the first tab's otherwise.
    if (!(await organizationList.isVisible())) await resultsPage.selectEntityTab('orgs');
    await expect(organizationList).toBeVisible();
  }

  /**
   * Open the detail of the organization whose card of the shown list matches `name`.
   *
   * The click goes through the card's title. A card's link wraps the whole card when the card lists no member, and its header alone when it lists some; the title is inside the card and inside the link in both shapes.
   */
  async function openListed(name: RegExp | string): Promise<void> {
    await organizationCards.filter({ hasText: name }).getByTestId(testIds.voter.results.cardTitle).first().click();
    await expect(detail).toBeVisible();
  }

  /**
   * Show one tab of the open detail. The detail must offer the tab beside another one: a detail with a single tab has no tab bar.
   */
  async function showTab(name: keyof typeof TAB_LABELS): Promise<void> {
    await expect(detail).toBeVisible();
    await detail.getByRole('tab', { name: TAB_LABELS[name] }).click();
  }

  return {
    openList,
    openListed,

    /**
     * Reload the results, as a voter who refreshes the page does, and show the list of organizations again. The voter's answers are kept by the browser, so the page is the results once more, with the entities as they are published now.
     */
    async reloadList(): Promise<void> {
      await page.reload();
      await expect(organizationCards.first()).toBeVisible({ timeout: TIMEOUTS.slowPage });
    },

    /**
     * Walk a voter to the results, show the list of organizations and open the detail of the one whose card matches `name`.
     */
    async openFromResults(name: RegExp | string): Promise<void> {
      await openList();
      await openListed(name);
    },

    /**
     * Assert that exactly one card of the list of organizations matches `name`.
     */
    async expectListed(name: RegExp | string): Promise<void> {
      await expect(organizationCards.filter({ hasText: name })).toHaveCount(1);
    },

    /**
     * Assert that no card of the list of organizations matches `name`. The list must hold a card, so the absence is read off a list that has rendered.
     */
    async expectNotListed(name: RegExp | string): Promise<void> {
      await expect(organizationCards.first()).toBeAttached();
      await expect(organizationCards.filter({ hasText: name })).toHaveCount(0);
    },

    /**
     * Assert that the header of the open detail shows `name`. A string is the whole name.
     */
    async expectName(name: RegExp | string): Promise<void> {
      await expect(detail.getByTestId(testIds.voter.results.cardTitle).first()).toHaveText(name);
    },

    /**
     * Assert that the info tab of the open detail shows the organization's answer to an info question: exactly one item holds both the question's text and `value`.
     */
    async expectInfoAnswer(questionText: RegExp | string, value: RegExp | string): Promise<void> {
      await showTab('info');
      const items = detail.getByTestId(testIds.voter.entityDetail.infoTab).getByTestId(testIds.voter.results.infoItem);
      await expect(items.filter({ hasText: questionText }).filter({ hasText: value })).toHaveCount(1);
    },

    /**
     * Assert that the opinions tab of the open detail shows the organization's answer to an opinion question: exactly one question matches `questionText`, and it marks exactly one choice as the organization's.
     * @param questionText - The question's text, or a pattern for it.
     * @param opts.choice - The label of the choice the organization selected. When given, the marked choice is that one.
     * @param opts.comment - The comment the organization wrote beside its answer. When given, the question shows it.
     */
    async expectOpinionAnswer(
      questionText: RegExp | string,
      opts: { choice?: string; comment?: string } = {}
    ): Promise<void> {
      await showTab('opinions');
      const question = detail
        .getByTestId(testIds.voter.entityDetail.opinionsTab)
        .getByTestId(testIds.voter.entityDetail.opinionQuestion)
        .filter({ hasText: questionText });
      await expect(question).toHaveCount(1);
      await expect(question.getByTestId(testIds.voter.entityDetail.entitySelectedAnswer)).toHaveCount(1);
      if (opts.choice !== undefined) {
        // The marker and the choice's label are both inside the choice's own label element, so the marked choice is the one whose name holds both.
        const marked = new RegExp(`${ENTITY_SELECTED_MARKER}\\s*${escapeRegExp(opts.choice)}`);
        await expect(question.getByRole('radio', { name: marked })).toHaveCount(1);
      }
      if (opts.comment !== undefined) {
        await expect(question.getByTestId(testIds.voter.entityDetail.opinionOpenAnswer)).toHaveText(opts.comment);
      }
    },

    /**
     * Assert that the avatar of the open detail shows initials and no image, and that the initials are exactly `text`. An avatar shows initials only for an entity without a usable image, and takes the entity's short name for them when that has six characters or fewer.
     */
    async expectAvatarInitials(text: string): Promise<void> {
      await expect(avatar).toBeVisible();
      await expect(avatar).toHaveText(text);
      await expect(avatar.getByRole('img')).toHaveCount(0);
    },

    /**
     * Assert that the avatar of the open detail is painted with a colour of the organization's own, and that this colour is not `not`: the colour a voter sees is the stored one adjusted for contrast.
     *
     * Three readings, in this order. The avatar's colour property holds a six-digit hex colour and nothing else, so a stored colour reaches the page only as a parsed colour. The avatar's computed background is that colour, so the property is what is painted. And the computed background is neither the neutral background of an entity without a colour nor `not`.
     * @param opts.not - The colour as it is stored, as `#rrggbb`.
     */
    async expectAvatarColor(opts: { not: string }): Promise<void> {
      await expect(avatar).toBeVisible();
      const property = (): Promise<string> =>
        avatar.evaluate((element) => (element as HTMLElement).style.getPropertyValue('--bg-color').trim());
      await expect.poll(property, { timeout: TIMEOUTS.page }).toMatch(HEX_COLOR);
      await expect(avatar).toHaveCSS('background-color', hexToRgb(await property()));

      const neutral = await page.evaluate(() => {
        const probe = document.createElement('div');
        probe.className = 'bg-base-300';
        document.body.appendChild(probe);
        const color = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return color;
      });
      await expect(avatar).not.toHaveCSS('background-color', neutral);
      await expect(avatar).not.toHaveCSS('background-color', hexToRgb(opts.not));
    },

    /**
     * Assert that the avatar of the open detail shows an image, and that the image has loaded: an avatar whose image fails to load shows initials instead.
     */
    async expectAvatarImage(): Promise<void> {
      const image = avatar.getByRole('img');
      await expect(image).toBeVisible({ timeout: TIMEOUTS.page });
      await expect
        .poll(() => image.evaluate((element) => (element as HTMLImageElement).naturalWidth), { timeout: TIMEOUTS.page })
        .toBeGreaterThan(0);
    }
  };
}

/** The steps of the organization-detail fixture. */
export type OrganizationDetailFixture = ReturnType<typeof createOrganizationDetail>;
