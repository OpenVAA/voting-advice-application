import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export class SettingsPage {
  readonly page: Page;
  readonly currentPassword: Locator;
  readonly newPassword: Locator;
  readonly confirmPassword: Locator;
  readonly updateButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.currentPassword = page.getByTestId(testIds.candidate.settings.currentPassword);
    this.newPassword = page.getByTestId(testIds.candidate.settings.newPassword);
    this.confirmPassword = page.getByTestId(testIds.candidate.settings.confirmPassword);
    this.updateButton = page.getByTestId(testIds.candidate.settings.updateButton);
  }

  /**
   * Fill in all password fields and click the update button.
   *
   * @param current - The current password
   * @param newPass - The new password to set
   * @param confirmPass - The password confirmation (should match newPass)
   */
  async changePassword(current: string, newPass: string, confirmPass: string): Promise<void> {
    await this.currentPassword.fill(current);
    await this.newPassword.fill(newPass);
    await this.confirmPassword.fill(confirmPass);
    await this.updateButton.click();
  }
}
