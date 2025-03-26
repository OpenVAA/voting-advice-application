/**
 * Load the data for a logged-in admin user.
 * - Verify user is authenticated
 * - Verify user has admin role
 *
 * Redirects to login if not authenticated, or unauthorized page if not an admin.
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
    return redirect(307, `/${lang}/admin/login?errorMessage=unauthorized`);
  }

  // Get user data
  const userData = await dataWriter.getBasicUserData({ authToken }).catch((e) => {
    logDebugError(`Error fetching user data: ${e?.message ?? 'No error message'}`);
    return undefined;
  });

  if (!userData) {
    // Data fetch error - redirect to login
    return await handleLogout('unauthorized');
  }

  // Try to determine if user is admin from the response
  // This may need to be adjusted based on the exact shape of the API response
  let isAdmin = false;

  try {
    // Try different ways to check for admin role based on potential API response shapes
    if (userData.role?.type === 'admin') {
      isAdmin = true;
    } else if (userData.role === 'admin') {
      isAdmin = true;
    } else if (userData.roleType === 'admin') {
      isAdmin = true;
    } else {
      // Final fallback using any type
      const userAny = userData as any;
      if (userAny?.role?.type === 'admin' || userAny?.role === 'admin') {
        isAdmin = true;
      }
    }
  } catch (e) {
    logDebugError(`Error checking admin role: ${e instanceof Error ? e.message : String(e)}`);
  }

  if (!isAdmin) {
    // User is authenticated but is not an admin - redirect to unauthorized page
    return redirect(307, `/${lang}/admin/unauthorized`);
  }

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
