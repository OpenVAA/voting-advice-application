import type { DataApiActionResult } from '$lib/api/base/actionResult.type';

export type PasswordResetScreenProps = {
  /**
   * The name of the app, shown above the heading.
   */
  appName: string;
  /**
   * The address of the signed-in account, shown as text and handed to the password form. When it is empty or absent, the label and the address are left out together.
   */
  email?: string;
  /**
   * The app's own store of a new password for the signed-in account.
   */
  setPassword: (opts: { password: string }) => Promise<DataApiActionResult>;
  /**
   * The address of the app's home, opened with the loads rerun once the password has been saved.
   */
  homeHref: string;
  /**
   * The test id of the screen's root.
   */
  testId: string;
};
