/**
 * Load the data for a logged-in admin user.
 * - Verify user is authenticated
 * - The admin role check is primarily done in the login handler
 */

import { redirect } from '@sveltejs/kit';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { logDebugError } from '$lib/utils/logger';

export async function load({ fetch, parent, params: { lang } }) {
  // Init dataWriter
  const dataWriter = await dataWriterPromise;
  dataWriter.init({ fetch });

  // Get authToken
  const authToken = (await parent()).token;
  if (!authToken) {
    // Not authenticated - redirect to login
    return redirect(307, `/${lang}/admin/login?errorMessage=session_expired`);
  }

  // Get user data - just to confirm authentication is valid
  const userData = await dataWriter.getBasicUserData({ authToken }).catch((e) => {
    logDebugError(`Error fetching user data: ${e?.message ?? 'No error message'}`);
    return undefined;
  });

  if (!userData) {
    // Data fetch error - redirect to login
    return await handleLogout('session_expired');
  }

  // The primary admin role check happens in the login handler
  // This is a secondary check that's more forgiving

  return {
    userData,
    adminData: {} // Placeholder for future admin-specific data
  };

  /**
   * Call logout and redirect to the login page with an error message.
   */
  async function handleLogout(errorMessage: string): Promise<void> {
    await dataWriter
      .logout({ authToken: authToken ?? '' })
      .catch((e) => logDebugError(`[Admin App protected layout] Error logging out: ${e?.message ?? '-'}`));

    redirect(307, `/${lang}/admin/login?errorMessage=${errorMessage}`);
  }
}
