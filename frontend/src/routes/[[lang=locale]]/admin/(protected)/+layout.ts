/**
 * Load the data for a logged-in admin user.
 * - Verify user is authenticated
 * - The admin role check is primarily done in the login handler
 */

import { redirect } from '@sveltejs/kit';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { logDebugError } from '$lib/utils/logger';
import { buildRoute } from '$lib/utils/route';
import type { LoginError } from '$lib/admin/utils/loginError';

export async function load({ fetch, parent, params: { lang } }) {
  // Init dataWriter
  const dataWriter = await dataWriterPromise;
  dataWriter.init({ fetch });

  // Get authToken
  const authToken = (await parent()).token;
  if (!authToken) {
    // Not authenticated - redirect to login
    return redirect(
      307,
      buildRoute({
        route: 'AdminAppLogin',
        lang,
        errorMessage: 'loginFailed'
      })
    );
  }

  // Get user data - just to confirm authentication is valid
  const userData = await dataWriter.getBasicUserData({ authToken }).catch((e) => {
    logDebugError(`Error fetching user data: ${e?.message ?? 'No error message'}`);
    return undefined;
  });
  if (!userData) return await handleError('loginFailed');

  // Check that the data is valid and the user is a candidate
  const { role } = userData;
  if (role !== 'admin') return await handleError('userNotAuthorized');

  // Verify user has admin role
  if (userData.role !== 'admin') {
    logDebugError(
      `[Admin App protected layout] Non-admin user attempted to access protected route: ${userData.username}`
    );
    return await handleError('userNotAuthorized');
  }

  return { userData };

  /**
   * Call logout and redirect to the login page with an error message.
   */
  async function handleError(error: LoginError): Promise<void> {
    await dataWriter
      .logout({ authToken: authToken ?? '' })
      .catch((e) => logDebugError(`[Admin App protected layout] Error logging out: ${e?.message ?? '-'}`));
    redirect(
      307,
      buildRoute({
        route: 'AdminAppLogin',
        lang,
        errorMessage: error
      })
    );
  }
}
