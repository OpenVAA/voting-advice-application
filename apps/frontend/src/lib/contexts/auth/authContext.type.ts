import type { DataApiActionResult } from '$lib/api/base/actionResult.type';

export type AuthContext = {
  /**
   * Whether the user is currently authenticated (has a valid Supabase session).
   * Reactive via `$derived` — access as a plain boolean property.
   */
  readonly isAuthenticated: boolean;
  /**
   * Whether the last logout's sign-out failed. `logout` clears it as it starts and sets it when the sign-out rejects. A reactive accessor: read it as `ctx.logoutFailed`, never destructure.
   */
  readonly logoutFailed: boolean;

  ////////////////////////////////////////////////////////////////////
  // Wrappers for DataWriter methods NB. These automatically handle authentication via Supabase sessions.
  ////////////////////////////////////////////////////////////////////

  /**
   * Logout the user. It rejects when the sign-out failed, in which case the session may still be alive, and the caller is what tells the user.
   * @returns A Promise resolving when logout is complete.
   */
  logout: () => Promise<void>;
  /**
   * Forget that the last logout's sign-out failed. A stable function, safe to destructure.
   */
  clearLogoutFailure: () => void;

  /**
   * Change the current user's password.
   * The one argument is the new password: authorisation comes from the active Supabase session (verified via cookies), so no current password is collected or forwarded. The wrapper serves three callers that all supply only a new password: the settings page's change-password form, the set-password view a user with no password is shown, and the password-reset page.
   * @param password - The new password.
   */
  setPassword: (opts: { password: string }) => Promise<DataApiActionResult>;
};
