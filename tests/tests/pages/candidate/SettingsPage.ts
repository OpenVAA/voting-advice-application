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
    // The testIds are on wrapper <div>s, not <input>s.
    // Target the PasswordField input (data-testid="password-field") within each wrapper.
    this.currentPassword = page.getByTestId(testIds.candidate.settings.currentPassword).getByTestId('password-field');
    // settings-new-password wraps PasswordSetter which contains two PasswordField inputs;
    // the first is the new password, the second is the confirmation.
    this.newPassword = page.getByTestId(testIds.candidate.settings.newPassword).getByTestId('password-field').first();
    this.confirmPassword = page.getByTestId(testIds.candidate.settings.confirmPassword).getByTestId('password-field');
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
