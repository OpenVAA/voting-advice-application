import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly readyMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.readyMessage = page.getByTestId(testIds.candidate.home.readyMessage);
  }

  async expectReady(): Promise<void> {
    await this.readyMessage.waitFor({ state: 'visible' });
  }
}
