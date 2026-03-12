import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export class PreviewPage {
  readonly page: Page;
  readonly container: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId(testIds.candidate.preview.container);
  }
}
