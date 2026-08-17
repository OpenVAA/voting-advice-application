/**
 * Load the data for a logged-in admin user.
 * - Verify user is authenticated
 * - The admin role check is primarily done in the login handler
 */

import { redirect } from '@sveltejs/kit';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { getUserData } from '$lib/auth';
import { getLocale } from '$lib/paraglide/runtime';
import { logDebugError } from '$lib/utils/logger';
import { buildRoute } from '$lib/utils/route';
import type { LoginError } from '$lib/admin/utils/loginError';

export async function load({ fetch, parent }) {
  const lang = getLocale();

  // Get user data - just to confirm authentication is valid
  const userData = await getUserData({ fetch, parent });

  if (!userData) {
    // Not authenticated - redirect to login
    return redirect(
      307,
      buildRoute({
        route: 'AdminAppLogin',
        locale: lang,
        errorMessage: 'loginFailed'
      })
    );
  }

  if (userData.role !== 'admin') return await handleError('userNotAuthorized');

  return { userData };

  /**
   * Call logout and redirect to the login page with an error message.
   */
  async function handleError(error: LoginError): Promise<void> {
    // Init dataWriter
    const dataWriter = await dataWriterPromise;
    dataWriter.init({ fetch });
    await dataWriter
      .logout({ authToken: '' })
      .catch((e) => logDebugError(`[Admin App protected layout] Error logging out: ${e?.message ?? '-'}`));
    redirect(
      307,
      buildRoute({
        route: 'AdminAppLogin',
        locale: lang,
        errorMessage: error
      })
    );
  }
}
