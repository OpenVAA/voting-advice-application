import type { DataApiActionResult } from '$lib/api/base/actionResult.type';

export type AuthContext = {
  /**
   * Whether the user is currently authenticated (has a valid Supabase session).
   * Reactive via `$derived` — access as a plain boolean property.
   */
  readonly isAuthenticated: boolean;

  ////////////////////////////////////////////////////////////////////
  // Wrappers for DataWriter methods NB. These automatically handle authentication via Supabase sessions.
  ////////////////////////////////////////////////////////////////////

  /**
   * Logout the user.
   * @returns A Promise resolving when logout is complete.
   */
  logout: () => Promise<void>;

  /**
   * Change the current user's password.
   * The one argument is the new password: authorisation comes from the active Supabase session (verified via cookies), so no current password is collected or forwarded. The wrapper serves three callers that all supply only a new password: the settings page's change-password form, the set-password view a user with no password is shown, and the password-reset page.
   * @param password - The new password.
   */
  setPassword: (opts: { password: string }) => Promise<DataApiActionResult>;
};
