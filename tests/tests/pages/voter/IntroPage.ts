import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export class IntroPage {
  readonly page: Page;
  readonly startButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.startButton = page.getByTestId(testIds.voter.intro.startButton);
  }

  async clickStart(): Promise<void> {
    await this.startButton.click();
  }
}
