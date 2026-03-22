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
   * Navigate to a specific question by clicking its card.
   *
   * @param index - Zero-based index of the question card to click
   */
  async navigateToQuestion(index: number): Promise<void> {
    await this.questionCard.nth(index).click();
  }

  /**
   * Expand all collapsed category sections so question cards are visible.
   * The Expander component uses a checkbox input to toggle visibility.
   */
  async expandAllCategories(): Promise<void> {
    const questionsContainer = this.page.getByTestId(testIds.candidate.questions.list);
    await questionsContainer.waitFor({ state: 'visible', timeout: 10000 });
    const unchecked = questionsContainer.locator('input[type="checkbox"]:not(:checked)');
    const count = await unchecked.count();
    for (let i = 0; i < count; i++) {
      await unchecked.nth(0).click();
    }
  }
}
