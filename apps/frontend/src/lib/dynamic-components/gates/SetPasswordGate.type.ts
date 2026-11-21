import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { LogoutButtonProps } from '$lib/dynamic-components/logoutButton';

export type SetPasswordGateProps = {
  /**
   * The address of the signed-in account. When it is empty or absent, the label and the address are left out together.
   */
  email?: string;
  /**
   * The app's own store of a new password for the signed-in account.
   */
  setPassword: (opts: { password: string }) => Promise<DataApiActionResult>;
  /**
   * The app's own sign-out, as the shared `LogoutButton` takes it. A rejection is logged and the view stays.
   */
  logout: LogoutButtonProps['logout'];
  /**
   * Called once a password has been saved, before the page's loads are rerun.
   */
  onSaved?: () => void;
  /**
   * The test id of the view's root.
   */
  testId: string;
};
