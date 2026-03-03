import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export class QuestionsPage {
  readonly page: Page;
  readonly questionCard: Locator;
  readonly nextButton: Locator;
  readonly previousButton: Locator;
  readonly skipButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.questionCard = page.getByTestId(testIds.voter.questions.card);
    this.nextButton = page.getByTestId(testIds.voter.questions.nextButton);
    this.previousButton = page.getByTestId(testIds.voter.questions.previousButton);
    this.skipButton = page.getByTestId(testIds.voter.questions.skipButton);
  }

  async answerOption(index: number): Promise<Locator> {
    return this.page.getByTestId(testIds.voter.questions.answerOption).nth(index);
  }

  async selectAnswer(optionIndex: number): Promise<void> {
    const option = await this.answerOption(optionIndex);
    await option.click();
  }

  async goNext(): Promise<void> {
    await this.nextButton.click();
  }

  async goPrevious(): Promise<void> {
    await this.previousButton.click();
  }

  async skip(): Promise<void> {
    await this.skipButton.click();
  }
}
