import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export class ResultsPage {
  readonly page: Page;
  readonly resultsList: Locator;
  readonly entityCard: Locator;
  readonly candidateSection: Locator;
  readonly partySection: Locator;
  readonly entityTabs: Locator;

  constructor(page: Page) {
    this.page = page;
    this.resultsList = page.getByTestId(testIds.voter.results.list);
    this.entityCard = page.getByTestId(testIds.voter.results.card);
    this.candidateSection = page.getByTestId(testIds.voter.results.candidateSection);
    this.partySection = page.getByTestId(testIds.voter.results.partySection);
    this.entityTabs = page.getByTestId(testIds.voter.results.entityTabs);
  }

  /**
   * Click the entity card at the given index (0-based).
   */
  async clickEntityCard(index: number): Promise<void> {
    await this.entityCard.nth(index).click();
  }

  /**
   * Switch to a tab in the entity type tabs (e.g., 'Candidates', 'Parties').
   * Uses role-based locator to find the tab button by name.
   */
  async switchToTab(tabName: string): Promise<void> {
    await this.entityTabs.getByRole('tab', { name: tabName }).click();
  }

  /**
   * Get the count of visible entity cards.
   */
  async getCardCount(): Promise<number> {
    return this.entityCard.count();
  }
}
