import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly startButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.startButton = page.getByTestId(testIds.voter.home.startButton);
  }

  async clickStart(): Promise<void> {
    await this.startButton.click();
  }
}
