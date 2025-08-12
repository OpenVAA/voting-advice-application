import type { Readable } from 'svelte/store';
import type { DataWriter } from '$lib/api/base/dataWriter.type';

export type AuthContext = {
  /**
   * Holds the jwt token. NB. The context’s internal methods use it automatically for authentication.
   */
  authToken: Readable<string | undefined>;

  ////////////////////////////////////////////////////////////////////
  // Wrappers for DataWriter methods
  // NB. These automatically handle authentication
  ////////////////////////////////////////////////////////////////////

  /**
   * Logout the user and redirect to the login page.
   * @returns A `Promise` resolving when the redirection is complete.
   */
  logout: () => Promise<void>;
  /**
   * Request that the a password reset email sent to the user.
   * @param email - The user’s email.
   * @returns A `Promise` resolving to an `DataApiActionResult` object.
   */
  requestForgotPasswordEmail: (opts: { email: string }) => ReturnType<DataWriter['requestForgotPasswordEmail']>;
  /**
   * Check whether the registration key is valid.
   * @param code - The password reset code.
   * @param password - The new password.
   * @returns A `Promise` resolving to an `DataApiActionResult` object.
   */
  resetPassword: (opts: { code: string; password: string }) => ReturnType<DataWriter['resetPassword']>;
  /**
   * Change a user’s password.
   * @param currentPassword - The current password.
   * @param password - The new password.
   * @returns A `Promise` resolving to an `DataApiActionResult` object.
   */
  setPassword: (opts: { currentPassword: string; password: string }) => ReturnType<DataWriter['setPassword']>;
};
