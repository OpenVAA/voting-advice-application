import type { Readable } from 'svelte/store';
import type { DataWriter } from '$lib/api/base/dataWriter.type';
import type { DataApiActionResult } from '$lib/api/base/actionResult.type';

export type AuthContext = {
  /**
   * Whether the user is currently authenticated (has a valid Supabase session).
   */
  isAuthenticated: Readable<boolean>;

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
   * @param code - Legacy Strapi reset code (ignored by Supabase adapter).
   * @param password - The new password.
   */
  resetPassword: (opts: { code: string; password: string }) => ReturnType<DataWriter['resetPassword']>;

  /**
   * Change the current user's password.
   * Only requires the new password -- old password requirement dropped per user decision.
   * @param password - The new password.
   */
  setPassword: (opts: { password: string }) => Promise<DataApiActionResult>;
};
