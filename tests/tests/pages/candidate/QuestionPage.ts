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
   * Fill in the comment/reasoning field if it exists.
   * The comment field only renders when the question has `customData.allowOpen = true`.
   * Expands the "Read More" section first if needed.
   *
   * @param text - The comment text to enter
   * @returns true if the comment field was found and filled, false otherwise
   */
  async fillComment(text: string): Promise<boolean> {
    // Try expanding the "Read More" section in case the field is inside it
    const expander = this.page.locator('input[type="checkbox"]').first();
    if (await expander.isVisible()) {
      await expander.click();
    }
    // The comment field only exists when question has allowOpen
    if (await this.commentInput.isVisible().catch(() => false)) {
      await this.commentInput.fill(text);
      return true;
    }
    return false;
  }
}
