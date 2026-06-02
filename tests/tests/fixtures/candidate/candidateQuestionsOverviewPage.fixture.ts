/**
 * @file candidateQuestionsOverviewPage fixture — Phase 89 Plan 02 (TIR4:77 + 189-244 + D-89-02).
 *
 * Function-fixture for the candidate /candidate/questions overview page
 * (`apps/frontend/src/routes/candidate/(protected)/questions/+page.svelte`).
 *
 * Surface (TIR4:77 + 189-244):
 *  - clickStart()                          — click the candidate-questions-start
 *                                            button (empty-state primary action).
 *  - expectIntroMessage()                  — assert the candidate-questions-intro
 *                                            wrapper is visible.
 *  - expectContinuePrompt()                — assert the candidate-questions-continue
 *                                            button is visible (partial-completion
 *                                            shortcut to next unanswered).
 *  - clickContinuePrompt()                 — click candidate-questions-continue.
 *  - expectCompletionMessage()             — assert the candidate-questions-home
 *                                            button is visible AND the completion
 *                                            ingress text is shown.
 *  - getCategoryExpander(name)             — returns an object with click() +
 *                                            expectExpanded(state) methods scoped
 *                                            to the matching category.
 *  - getQuestionCard(label)                — returns the Locator for the matching
 *                                            question card (label-based per
 *                                            general API principle).
 *  - clickEditQuestion(textOrNth)          — polymorphic dispatch:
 *                                              number → 0-indexed nth edit button
 *                                              string|RegExp → label match.
 *  - goToQuestion(textOrNth)               — expand all categories, click the
 *                                            matching question's edit action,
 *                                            await navigation onto the
 *                                            per-question route. Use instead of
 *                                            page.goto() with an external_id
 *                                            (the URL is keyed on internal id).
 *
 * SIBLING (not replacement) to the legacy tests/tests/pages/candidate/QuestionsPage.ts.
 *
 * **Rigidity contract** (Phase 88 Plan 04 SCOPE acceptance #6):
 * - NO `expect.soft`, NO `try/catch` wrapping `expect(...)`, NO
 *   `.catch(() => null)` on assertion-bearing locator interactions.
 */

import { expect } from '@playwright/test';
import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export interface CategoryExpanderHandle {
  click(): Promise<void>;
  expectExpanded(state: boolean): Promise<void>;
}

export function createCandidateQuestionsOverviewPage(page: Page) {
  /**
   * Return the question-card Locator filtered by displayed label.
   */
  function cardByLabel(label: string | RegExp): Locator {
    return page.getByTestId(testIds.candidate.questions.card).filter({ hasText: label });
  }

  /**
   * Click the per-card edit/answer action. When passed a number, clicks the
   * nth (0-indexed) action button in DOM order; when passed a string|RegExp,
   * clicks the action inside the label-matched card. Shared by
   * `clickEditQuestion` and `goToQuestion`.
   */
  async function clickEdit(textOrNth: string | RegExp | number): Promise<void> {
    const button =
      typeof textOrNth === 'number'
        ? page.getByTestId(testIds.candidate.questions.cardAction).nth(textOrNth)
        : cardByLabel(textOrNth).first().getByTestId(testIds.candidate.questions.cardAction);
    await expect(button).toBeVisible();
    await button.click();
  }

  /**
   * Expect the page to be visible.
   */
  async function expectPageVisible(visible = true): Promise<void> {
    const pageLocator = page.getByTestId(testIds.candidate.questions.intro);
    await expect(pageLocator).toBeVisible({ visible, timeout: 5_000 });
  }

  return {
    /**
     * Go to the overview page via its canonical URL and await to be visible.
     */
    async goToPage(): Promise<void> {
      await page.goto('/en/candidate/questions');
      await expectPageVisible();
    },

    expectPageVisible,

    /**
     * Click the empty-state primary action.
     */
    async clickStart(): Promise<void> {
      await page.getByTestId(testIds.candidate.questions.start).click();
    },

    /**
     * Assert the empty-state intro wrapper is visible.
     */
    async expectIntroMessage(): Promise<void> {
      await expect(page.getByTestId(testIds.candidate.questions.intro)).toBeVisible();
    },

    /**
     * Assert the partial-completion candidate-questions-continue shortcut
     * is visible.
     */
    async expectContinuePrompt(): Promise<void> {
      await expect(page.getByTestId('candidate-questions-continue')).toBeVisible();
    },

    /**
     * Click the candidate-questions-continue partial-completion shortcut.
     */
    async clickContinuePrompt(): Promise<void> {
      await page.getByTestId('candidate-questions-continue').click();
    },

    /**
     * Assert the completion-state surface: the candidate-questions-home
     * primary-action button is rendered and the list view is in DOM.
     */
    async expectCompletionMessage(): Promise<void> {
      await expect(page.getByTestId('candidate-questions-home')).toBeVisible();
      await expect(page.getByTestId(testIds.candidate.questions.list)).toBeVisible();
    },

    /**
     * Return a handle for the category-expander whose visible title matches
     * `name`. Filters via hasText against the testid-bearing wrapper.
     */
    getCategoryExpander(name: string | RegExp): CategoryExpanderHandle {
      const expander = page.getByTestId(testIds.candidate.questions.categoryExpander).filter({ hasText: name }).first();
      return {
        async click(): Promise<void> {
          // The Expander widget exposes a clickable header (the inner
          // checkbox toggles open/closed state). Click the inner checkbox
          // to flip state. The Expander wraps a single role=checkbox per
          // collapse.
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
     * Click the edit button for a question. When passed a number, clicks
     * the nth (0-indexed) edit button in DOM order. When passed a string
     * or RegExp, locates the matching question card by displayed text and
     * clicks its edit button.
     *
     * The card CONTAINER carries `candidate-questions-card` (filterable by the
     * question label), while the per-card action button (Answer / Edit) carries
     * `candidate-questions-card-action`. Click the action button — either the nth
     * in DOM order, or the one inside the label-matched card.
     */
    async clickEditQuestion(textOrNth: string | RegExp | number): Promise<void> {
      await clickEdit(textOrNth);
    },

    /**
     * Navigate to a question's editor by clicking through the overview (the
     * per-question URL is keyed on the internal question id, NOT the seed
     * external_id, so `page.goto()` with an external_id is impossible).
     *
     * Steps:
     *   1. Expand EVERY category-expander on the overview (a collapsed
     *      category hides its question cards; defaultExpanded only fires when
     *      a category has unanswered questions, so already-answered categories
     *      render collapsed). Idempotent — expanders already open are skipped.
     *   2. Click the matching question's edit/answer action (number → nth in
     *      DOM order; string|RegExp → label match).
     *   3. Await navigation off the overview onto the per-question route
     *      (`/candidate/questions/<questionId>`).
     */
    async goToQuestion(textOrNth: string | RegExp | number): Promise<void> {
      const expanders = page.getByTestId(testIds.candidate.questions.categoryExpander);
      const expanderCount = await expanders.count();
      for (let i = 0; i < expanderCount; i++) {
        const checkbox = expanders.nth(i).getByRole('checkbox').first();
        await checkbox.check();
        await expect(checkbox).toBeChecked();
      }
      await clickEdit(textOrNth);
      await expectPageVisible(false);
    }
  };
}

export type CandidateQuestionsOverviewPageFixture = ReturnType<typeof createCandidateQuestionsOverviewPage>;
