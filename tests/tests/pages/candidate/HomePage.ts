import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export class HomePage {
  readonly page: Page;
  readonly statusMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.statusMessage = page.getByTestId(testIds.candidate.home.statusMessage);
  }

  async expectStatus(): Promise<void> {
    await this.statusMessage.waitFor({ state: 'visible' });
  }
}
