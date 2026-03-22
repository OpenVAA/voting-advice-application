import { testIds } from '../../utils/testIds';
import type { Locator, Page } from '@playwright/test';

export class SettingsPage {
  readonly page: Page;
  readonly updateButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.updateButton = page.getByTestId(testIds.candidate.settings.updateButton);
  }

  /**
   * Fill in password fields and click the update button.
   * Supabase uses session-based auth, so no current password is required.
   * The PasswordSetter component renders two PasswordField inputs, both with
   * data-testid="password-field". The first is the new password, the second
   * is the confirmation (wrapped in data-testid="settings-confirm-password").
   *
   * @param _current - Ignored (Supabase doesn't require current password)
   * @param newPass - The new password to set
   * @param confirmPass - The password confirmation (should match newPass)
   */
  async changePassword(_current: string, newPass: string, confirmPass: string): Promise<void> {
    // First password field (new password) — first password-field testId on the page
    const passwordFields = this.page.getByTestId('password-field');
    await passwordFields.first().fill(newPass);
    // Second password field (confirm password) — inside the settings-confirm-password wrapper
    await this.page.getByTestId(testIds.candidate.settings.confirmPassword).getByTestId('password-field').fill(confirmPass);
    await this.updateButton.click();
  }
}
