/**
 * @file contestantPreviewPage fixture.
 *
 * Function-fixture for the Contestant App's preview page (`apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/preview/+page.svelte`), which renders the profile of the entity the session's user edits via the shared EntityDetails component.
 *
 * Surface:
 *  - open()                                       — open the preview of the one entity the session's user edits, and wait until its card is shown.
 *  - expectCardName(name)                         — assert the name in the card's header.
 *  - expectTagLine(shortName)                     — assert the line that shows how the entity is marked beside its candidates, and the short name in it.
 *  - expectNoTagLine()                            — assert that the loaded card has no such line.
 *  - expectTabs(names)                            — assert the card's tabs, in order.
 *  - expectNoTab(name)                            — assert that the loaded card offers no tab of that name.
 *  - expectFitsViewport()                         — assert that the page, with its card loaded, is no wider than its viewport.
 *  - expectInfoAnswer(qName, aValue)              — assert the named info question is rendered AND its answer value matches.
 *  - expectOpinionAnswer(qName, aNthChecked)      — assert the named opinion question is rendered; aNthChecked = 0-indexed checked choice OR null for "rendered-but-unanswered".
 *  - expectPortraitVisible()                      — assert the candidate portrait image is in DOM.
 *  - expectNoVoterComparison()                    — assert NO voter-comparison sub-match messaging is rendered (the preview view is from the candidate's perspective, so "you and X agree"-type text must not appear).
 *
 * Internally delegates to the shared EntityDetails testids (candidate preview reuses voter EntityDetails).
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import { buildEntityLessRoute } from '../../utils/contestantEntityUrl';
import { testIds } from '../../utils/testIds';
import { createPageGeometry } from '../shared/pageGeometry.fixture';
import { TAB_LABELS } from '../voter/entityDetails.fixture';
import type { Locator, Page } from '@playwright/test';

/** A tab of the card, by the keyword the `entityDetails.contents` setting names it with. */
export type PreviewTabName = keyof typeof TAB_LABELS;

export function createContestantPreviewPage(page: Page) {
  function container(): Locator {
    return page.getByTestId(testIds.contestant.preview.container);
  }

  /** The card: the entity's details, which the page renders once the entity's data is loaded. */
  function card(): Locator {
    return container().getByTestId(testIds.voter.results.entityDetails);
  }

  /** The line that shows how the entity is marked beside its candidates. */
  function tagLine(): Locator {
    return container().getByTestId(testIds.contestant.preview.tag);
  }

  /**
   * Wait until the card is shown. The page shows a loading view, in the server-rendered markup too, until it has loaded the entity's data after hydration.
   */
  async function expectCardLoaded(): Promise<void> {
    await expect(card()).toBeVisible({ timeout: TIMEOUTS.slowPage });
  }

  return {
    /**
     * Open the preview of the one entity the session's user edits, and wait until its card is shown.
     */
    async open(): Promise<void> {
      await page.goto(buildEntityLessRoute({ route: 'ContestantAppPreview', locale: 'en' }));
      await expectCardLoaded();
    },

    /**
     * Assert that the header of the card shows `name`. A string is the whole name.
     */
    async expectCardName(name: RegExp | string): Promise<void> {
      await expect(card().getByTestId(testIds.voter.results.cardTitle).first()).toHaveText(name, {
        timeout: TIMEOUTS.page
      });
    },

    /**
     * Assert that the card holds the line that shows how the entity is marked beside its candidates, above the entity's details, and that the line shows `shortName`.
     */
    async expectTagLine(shortName: RegExp | string): Promise<void> {
      await expectCardLoaded();
      await expect(tagLine()).toBeVisible({ timeout: TIMEOUTS.page });
      await expect(tagLine()).toContainText(shortName);
      // The line is the first thing in the card: it comes before the entity's details in the document.
      await expect(tagLine().or(card()).first()).toHaveAttribute('data-testid', testIds.contestant.preview.tag);
    },

    /**
     * Assert that the card has no such line. The absence is read off a card that has loaded, because the line is rendered with the card and not before it.
     */
    async expectNoTagLine(): Promise<void> {
      await expectCardLoaded();
      await expect(tagLine()).toHaveCount(0);
    },

    /**
     * Assert that the card offers exactly the tabs `names`, in that order.
     */
    async expectTabs(names: ReadonlyArray<PreviewTabName>): Promise<void> {
      await expectCardLoaded();
      const tabs = card().getByRole('tab');
      await expect(tabs).toHaveCount(names.length, { timeout: TIMEOUTS.page });
      for (const [index, name] of names.entries()) {
        await expect(tabs.nth(index)).toHaveAccessibleName(TAB_LABELS[name]);
      }
    },

    /**
     * Assert that the card offers no tab `name`. The absence is read off a card that has loaded.
     */
    async expectNoTab(name: PreviewTabName): Promise<void> {
      await expectCardLoaded();
      await expect(card().getByRole('tab', { name: TAB_LABELS[name] })).toHaveCount(0);
    },

    /**
     * Assert that the page is no wider than its viewport, once its card has loaded.
     */
    async expectFitsViewport(): Promise<void> {
      await expectCardLoaded();
      await createPageGeometry(page).expectNoHorizontalOverflow();
    },

    /**
     * Assert the info-question matching `qName` is rendered inside the preview, and its visible answer slot contains `aValue`.
     */
    async expectInfoAnswer(qName: string | RegExp, aValue: string | RegExp): Promise<void> {
      const c = container();
      // EntityDetails renders info items via the info-item testid (shared with the voter results entity details surface). The full preview container may render either the EntityDetails directly or a composed surface; we scope to the container and filter by qName.
      const item = c.getByTestId(testIds.voter.results.infoItem).filter({ hasText: qName }).first();
      await expect(item).toBeVisible();
      await expect(item).toContainText(aValue);
    },

    /**
     * Assert the opinion-question matching `qName` is rendered. When `aNthChecked` is a number, additionally assert the nth choice is in the checked state. When `null`, assert NO choice is in the checked state (rendered-but-unanswered).
     */
    async expectOpinionAnswer(qName: string | RegExp, aNthChecked: number | null): Promise<void> {
      const c = container();
      // EntityDetails renders Info / Opinions (/ Children) as tabs and only mounts the active tab's content (`info` is active by default). Opinion questions are therefore absent from the DOM until the Opinions tab is activated.
      await c.getByRole('tab', { name: /opinions/i }).click();
      const question = c.getByTestId(testIds.voter.entityDetail.opinionQuestion).filter({ hasText: qName }).first();
      await expect(question).toBeVisible();
      const choices = question.getByTestId('question-choice');
      if (aNthChecked === null) {
        // Assert NO choice has the checked-state indicator. The checked-indicator is the entity-selected-answer sr-only sibling marker on QuestionChoices.svelte. Absence means rendered-but-unanswered.
        await expect(question.getByTestId(testIds.voter.entityDetail.entitySelectedAnswer)).toHaveCount(0);
        return;
      }
      // Assert the nth choice is the selected-answer.
      const choice = choices.nth(aNthChecked);
      await expect(choice).toBeVisible();
      // reason: the marker is a sr-only SIBLING of the choice's `<input data-testid="question-choice">` inside their shared `<label>` (an <input> cannot have children — see the choice `<label>` in QuestionChoices.svelte). The only way to reach the sibling from the input locator is an xpath parent-axis traversal; the parent <label> carries no stable testId, so there is no getByTestId/getByRole path to the parent. The chained getByTestId stays.
      // eslint-disable-next-line playwright/no-restricted-locators, playwright/no-raw-locators
      const choiceLabel = choice.locator('xpath=..');
      await expect(choiceLabel.getByTestId(testIds.voter.entityDetail.entitySelectedAnswer)).toHaveCount(1);
    },

    /**
     * Assert the candidate portrait image is rendered.
     *
     * The preview shows a loading indicator, including in the server-rendered page, until its candidate-data reload settles after hydration. The wait is for that state to resolve, however long it takes, and only then is the portrait asserted with the default budget.
     */
    async expectPortraitVisible(): Promise<void> {
      const c = container();
      await expect(c).toBeVisible({ timeout: TIMEOUTS.testMax });
      await expect(c.getByTestId(testIds.shared.loading)).toHaveCount(0, { timeout: TIMEOUTS.testMax });
      await expect(c.getByRole('img').first()).toBeVisible();
    },

    /**
     * Assert no voter-comparison messaging is rendered. The candidate's own preview surfaces the candidate's answers but MUST NOT compare against a hypothetical voter (score-gauge, sub-matches, "you and X agree/disagree" copy). This is a hard absence assertion.
     */
    async expectNoVoterComparison(): Promise<void> {
      const c = container();
      await expect(c.getByTestId(testIds.voter.results.scoreGauge)).toHaveCount(0);
      await expect(c.getByTestId(testIds.voter.results.subMatches)).toHaveCount(0);
    }
  };
}

export type ContestantPreviewPageFixture = ReturnType<typeof createContestantPreviewPage>;
