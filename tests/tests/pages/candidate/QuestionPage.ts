import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export class QuestionPage {
  readonly page: Page;
  readonly answerInput: Locator;
  readonly commentInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.answerInput = page.getByTestId(testIds.candidate.questions.answerInput);
    this.commentInput = page.getByTestId(testIds.candidate.questions.commentInput);
    this.saveButton = page.getByTestId(testIds.candidate.questions.saveButton);
  }

  /**
   * Click the save button to save the current answer.
   */
  async saveAnswer(): Promise<void> {
    await this.saveButton.click();
  }

  /**
   * Fill in the comment/reasoning field.
   *
   * @param text - The comment text to enter
   */
  async fillComment(text: string): Promise<void> {
    await this.commentInput.fill(text);
  }
}
