import type { DataApiActionResult } from '$lib/api/base/actionResult.type';
import type { DataWriter } from '$lib/api/base/dataWriter.type';

export type AuthContext = {
  /**
   * Whether the user is currently authenticated (has a valid Supabase session).
   * Reactive via `$derived` — access as a plain boolean property.
   */
  readonly isAuthenticated: boolean;

  ////////////////////////////////////////////////////////////////////
  // Wrappers for DataWriter methods
  // NB. These automatically handle authentication via Supabase sessions.
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
   * Mirrors the writer's real `setPassword` shape (universalDataWriter.ts:147:
   * `WithAuth & { currentPassword: string; password: string }`). `currentPassword` is
   * UI-collected but a Supabase-side no-op (the session, not the old password, is verified
   * — Pitfall 1). It is OPTIONAL at this wrapper level because the wrapper serves three
   * flows: the settings change-password page supplies it, while the register (first-set)
   * and password-reset (post-recovery) flows have no current password to supply and call
   * `setPassword({ password })`. The impl defaults it to `''` when forwarding to the writer's
   * required shim, so runtime behavior is unchanged across all three flows.
   * @param currentPassword - The current password (optional; backend no-op under Supabase session auth).
   * @param password - The new password.
   */
  setPassword: (opts: { currentPassword?: string; password: string }) => Promise<DataApiActionResult>;
};
