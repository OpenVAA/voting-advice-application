import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { DataWriter } from '$lib/api/base/dataWriter.type';

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
   * Request a password reset email.
   * @param email - The user's email.
   */
  requestForgotPasswordEmail: (opts: { email: string }) => ReturnType<DataWriter['requestForgotPasswordEmail']>;

  /**
   * Reset password using a recovery session (after clicking email link).
   * The code parameter is ignored by Supabase adapter (session is established via auth callback).
   * @param code - Legacy reset code (ignored -- session is established via auth callback).
   * @param password - The new password.
   */
  resetPassword: (opts: { code: string; password: string }) => ReturnType<DataWriter['resetPassword']>;

  /**
   * Change the current user's password.
   * The one argument is the new password: authorisation comes from the active Supabase session (verified via cookies), so no current password is collected or forwarded. The wrapper serves three flows that all supply only a new password — the settings change-password page, the register first-set page and the post-recovery password-reset page.
   * @param password - The new password.
   */
  setPassword: (opts: { password: string }) => Promise<DataApiActionResult>;
};
