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
}
