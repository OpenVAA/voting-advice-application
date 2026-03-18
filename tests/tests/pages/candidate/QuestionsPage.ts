import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export class QuestionsPage {
  readonly page: Page;
  readonly questionCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.questionCard = page.getByTestId(testIds.candidate.questions.card);
  }

  /**
   * Wait for the questions page to finish loading and render its content.
   * The page shows either a question list or a "start" button depending on
   * whether the candidate has any answers.
   */
  async waitForLoad(): Promise<void> {
    await this.page
      .getByTestId('candidate-questions-list')
      .or(this.page.getByTestId('candidate-questions-start'))
      .waitFor({ state: 'visible', timeout: 15000 });
  }

  /**
   * Expand all collapsed category Expanders so their question cards become visible.
   *
   * The questions page wraps each category in an Expander component that uses a
   * hidden checkbox to toggle visibility. Categories with all questions answered
   * start collapsed, so the cards inside them are not in the DOM.
   *
   * Waits for the page to finish loading before expanding.
   */
  async expandAllCategories(): Promise<void> {
    await this.waitForLoad();
    const checkboxes = this.page.locator('.collapse input[type="checkbox"]');
    const count = await checkboxes.count();
    for (let i = 0; i < count; i++) {
      if (!(await checkboxes.nth(i).isChecked())) {
        await checkboxes.nth(i).click();
      }
    }
  }

  /**
   * Navigate to a specific question by clicking its card.
   *
   * @param index - Zero-based index of the question card to click
   */
  async navigateToQuestion(index: number): Promise<void> {
    await this.questionCard.nth(index).click();
  }
}
