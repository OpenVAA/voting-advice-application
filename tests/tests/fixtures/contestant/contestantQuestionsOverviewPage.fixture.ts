/**
 * @file contestantQuestionsOverviewPage fixture.
 *
 * Function-fixture for the candidate /contestant/questions overview page (`apps/frontend/src/routes/contestant/(protected)/[entityType=servedEntityType]/[entityId=uuid]/(nominated)/questions/+page.svelte`).
 *
 * Surface:
 *  - clickStart()                          — click the contestant-questions-start button (empty-state primary action).
 *  - expectIntroMessage()                  — assert the contestant-questions-intro wrapper is visible.
 *  - expectContinuePrompt()                — assert the contestant-questions-continue button is visible (partial-completion shortcut to next unanswered).
 *  - clickContinuePrompt()                 — click contestant-questions-continue.
 *  - expectCompletionMessage()             — assert the contestant-questions-home button is visible AND the completion ingress text is shown.
 *  - getCategoryExpander(name)             — returns an object with click() + expectExpanded(state) methods scoped to the matching category.
 *  - getQuestionCard(label)                — returns the Locator for the matching question card (label-based per general API principle).
 *  - clickEditQuestion(textOrNth)          — polymorphic dispatch:
 *                                              number → 0-indexed nth edit button
 *                                              string|RegExp → label match.
 *  - goToQuestion(textOrNth)               — expand all categories, click the matching question's edit action, await navigation onto the per-question route. Use instead of page.goto() with an external_id (the URL is keyed on internal id).
 *  - expectProgress({ answered, total })    — assert the header's progress bar: how many opinion questions are answered, out of how many.
 *  - expectCardText(label, text)           — expand all categories, then assert the matching question card holds `text`, such as the comment of a saved answer.
 *  - expectQuestionsListed(labels)         — expand all categories, then assert that the list holds exactly one card for each label and no other card.
 *
 * **Rigidity contract:** NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { TIMEOUTS } from '../../helpers';
import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export interface CategoryExpanderHandle {
  click(): Promise<void>;
  expectExpanded(state: boolean): Promise<void>;
}

export function createContestantQuestionsOverviewPage(page: Page) {
  /**
   * Return the question-card Locator filtered by displayed label.
   */
  function cardByLabel(label: string | RegExp): Locator {
    return page.getByTestId(testIds.contestant.questions.card).filter({ hasText: label });
  }

  /**
   * Click the per-card edit/answer action. When passed a number, clicks the nth (0-indexed) action button in DOM order; when passed a string|RegExp, clicks the action inside the label-matched card. Shared by `clickEditQuestion` and `goToQuestion`.
   */
  async function clickEdit(textOrNth: string | RegExp | number): Promise<void> {
    const button =
      typeof textOrNth === 'number'
        ? page.getByTestId(testIds.contestant.questions.cardAction).nth(textOrNth)
        : cardByLabel(textOrNth).first().getByTestId(testIds.contestant.questions.cardAction);
    await expect(button).toBeVisible();
    await button.click();
  }

  /**
   * Expand every category of the list. A collapsed category does not render its question cards, and one whose questions are all answered starts collapsed. Expanders that are already open are left as they are.
   */
  async function expandAllCategories(): Promise<void> {
    const expanders = page.getByTestId(testIds.contestant.questions.categoryExpander);
    const expanderCount = await expanders.count();
    for (let i = 0; i < expanderCount; i++) {
      const checkbox = expanders.nth(i).getByRole('checkbox').first();
      await checkbox.check();
      await expect(checkbox).toBeChecked();
    }
  }

  /**
   * Expect the page to be visible.
   */
  async function expectPageVisible(visible = true): Promise<void> {
    const pageLocator = page.getByTestId(testIds.contestant.questions.intro);
    await expect(pageLocator).toBeVisible({ visible, timeout: 5_000 });
  }

  return {
    /**
     * Go to the overview page via its canonical URL and await to be visible.
     */
    async goToPage(): Promise<void> {
      await page.goto('/en/contestant/questions');
      await expectPageVisible();
    },

    expectPageVisible,

    /**
     * Click the empty-state primary action.
     */
    async clickStart(): Promise<void> {
      await page.getByTestId(testIds.contestant.questions.start).click();
    },

    /**
     * Assert the empty-state intro wrapper is visible.
     */
    async expectIntroMessage(): Promise<void> {
      await expect(page.getByTestId(testIds.contestant.questions.intro)).toBeVisible();
    },

    /**
     * Assert the partial-completion contestant-questions-continue shortcut is visible.
     */
    async expectContinuePrompt(): Promise<void> {
      await expect(page.getByTestId('contestant-questions-continue')).toBeVisible();
    },

    /**
     * Click the contestant-questions-continue partial-completion shortcut.
     */
    async clickContinuePrompt(): Promise<void> {
      await page.getByTestId('contestant-questions-continue').click();
    },

    /**
     * Assert the completion-state surface: the contestant-questions-home primary-action button is rendered and the list view is in DOM.
     */
    async expectCompletionMessage(): Promise<void> {
      await expect(page.getByTestId('contestant-questions-home')).toBeVisible();
      await expect(page.getByTestId(testIds.contestant.questions.list)).toBeVisible();
    },

    /**
     * Return a handle for the category-expander whose visible title matches `name`. Filters via hasText against the testid-bearing wrapper.
     */
    getCategoryExpander(name: string | RegExp): CategoryExpanderHandle {
      const expander = page
        .getByTestId(testIds.contestant.questions.categoryExpander)
        .filter({ hasText: name })
        .first();
      return {
        async click(): Promise<void> {
          // The Expander widget exposes a clickable header (the inner checkbox toggles open/closed state). Click the inner checkbox to flip state. The Expander wraps a single role=checkbox per collapse.
          await expander.getByRole('checkbox').first().click();
        },
        async expectExpanded(state: boolean): Promise<void> {
          await expect(expander.getByRole('checkbox').first()).toBeChecked({ checked: state });
        }
      };
    },

    /**
     * Return the question-card Locator for the matching label.
     */
    getQuestionCard(label: string | RegExp): Locator {
      return cardByLabel(label);
    },

    /**
     * Click the edit button for a question. When passed a number, clicks the nth (0-indexed) edit button in DOM order. When passed a string or RegExp, locates the matching question card by displayed text and clicks its edit button.
     *
     * The card CONTAINER carries `contestant-questions-card` (filterable by the question label), while the per-card action button (Answer / Edit) carries `contestant-questions-card-action`. Click the action button — either the nth in DOM order, or the one inside the label-matched card.
     */
    async clickEditQuestion(textOrNth: string | RegExp | number): Promise<void> {
      await clickEdit(textOrNth);
    },

    /**
     * Navigate to a question's editor by clicking through the overview (the per-question URL is keyed on the internal question id, NOT the seed external_id, so `page.goto()` with an external_id is impossible).
     *
     * Steps:
     *   1. Expand EVERY category-expander on the overview (a collapsed category hides its question cards; defaultExpanded only fires when a category has unanswered questions, so already-answered categories render collapsed). Idempotent — expanders already open are skipped.
     *   2. Click the matching question's edit/answer action (number → nth in
     *      DOM order; string|RegExp → label match).
     *   3. Await navigation off the overview onto the per-question route (`/contestant/questions/<questionId>`).
     */
    async goToQuestion(textOrNth: string | RegExp | number): Promise<void> {
      await expandAllCategories();
      await clickEdit(textOrNth);
      await expectPageVisible(false);
    },

    /**
     * Assert the progress bar of the header: `answered` of `total` opinion questions. The bar's value is animated, so the assertion waits for it to settle.
     */
    async expectProgress({ answered, total }: { answered: number; total: number }): Promise<void> {
      const bar = page.getByRole('progressbar');
      await expect(bar).toBeVisible({ timeout: TIMEOUTS.page });
      await expect(bar).toHaveAttribute('max', String(total), { timeout: TIMEOUTS.page });
      await expect(bar).toHaveJSProperty('value', answered, { timeout: TIMEOUTS.page });
    },

    /**
     * Assert that the card of the question matching `label` holds `text`. Every category is expanded first, so the card is read whichever category it is in.
     */
    async expectCardText(label: string | RegExp, text: string | RegExp): Promise<void> {
      await expect(page.getByTestId(testIds.contestant.questions.list)).toBeVisible({ timeout: TIMEOUTS.page });
      await expandAllCategories();
      await expect(cardByLabel(label).first()).toContainText(text, { timeout: TIMEOUTS.page });
    },

    /**
     * Assert which questions the list holds: one card for each of `labels`, and as many cards as labels. Every category is expanded first, so a card is counted whichever category it is in. The list shows its cards once one question is answered, so the step is for an entity with a saved answer.
     * @param labels - The label of each question the entity is asked, in any order.
     */
    async expectQuestionsListed(labels: ReadonlyArray<string>): Promise<void> {
      await expect(page.getByTestId(testIds.contestant.questions.list)).toBeVisible({ timeout: TIMEOUTS.page });
      await expandAllCategories();
      for (const label of labels) {
        await expect(cardByLabel(label), `the list holds one card of the question ${label}`).toHaveCount(1, {
          timeout: TIMEOUTS.page
        });
      }
      await expect(page.getByTestId(testIds.contestant.questions.card)).toHaveCount(labels.length);
    }
  };
}

export type ContestantQuestionsOverviewPageFixture = ReturnType<typeof createContestantQuestionsOverviewPage>;
