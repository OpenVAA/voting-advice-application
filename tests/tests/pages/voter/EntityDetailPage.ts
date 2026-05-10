import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export class EntityDetailPage {
  readonly page: Page;
  readonly detailContainer: Locator;
  readonly infoTab: Locator;
  readonly opinionsTab: Locator;
  readonly childrenTab: Locator;
  readonly drawer: Locator;
  private readonly inDrawer: boolean;

  constructor(page: Page, options?: { inDrawer?: boolean }) {
    this.page = page;
    this.inDrawer = options?.inDrawer ?? false;
    // getByRole('dialog') matches only the open <dialog>; closed dialogs are
    // hidden and excluded from the accessibility tree (RESEARCH §"Pattern 3"
    // canonical example).
    this.drawer = page.getByRole('dialog');

    // Scope locators to either the drawer or the full page
    const scope = this.inDrawer ? this.drawer : page;

    this.detailContainer = this.inDrawer
      ? scope.getByTestId('entity-details')
      : page.getByTestId(testIds.voter.entityDetail.container);
    this.infoTab = scope.getByTestId(testIds.voter.entityDetail.infoTab);
    this.opinionsTab = scope.getByTestId(testIds.voter.entityDetail.opinionsTab);
    this.childrenTab = scope.getByTestId(testIds.voter.entityDetail.childrenTab);
  }

  /**
   * Switch to a tab in the entity detail view.
   */
  async switchToTab(tabName: 'info' | 'opinions' | 'children'): Promise<void> {
    const tabMap = {
      info: this.infoTab,
      opinions: this.opinionsTab,
      children: this.childrenTab
    } as const;
    await tabMap[tabName].click();
  }

  /**
   * Close the drawer (only applicable when inDrawer mode is true).
   * Presses Escape to dismiss the dialog.
   */
  async close(): Promise<void> {
    await this.page.keyboard.press('Escape');
  }
}
