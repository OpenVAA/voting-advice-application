/**
 * Load the data for a logged-in admin user.
 * - Verify user is authenticated
 * - The admin role check is primarily done in the login handler
 */

import { log } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { createDataWriter } from '$lib/api/dataWriter';
import { getUserData } from '$lib/auth';
import { getLocale } from '$lib/paraglide/runtime';
import { buildRoute } from '$lib/routes';
import type { LoginError } from '$lib/admin/utils/loginError';

export async function load({ fetch, parent }) {
  const lang = getLocale();
  const { supabaseClient } = await parent();

  // Get user data - just to confirm authentication is valid
  const userData = await getUserData({ fetch, client: supabaseClient }, { parent });

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
    // The logout writer comes from the factory on the SAME client the load itself used, rather than re-configuring a shared one mid-error-path.
    const dataWriter = createDataWriter({ fetch, client: supabaseClient });
    await dataWriter
      .logout()
      .catch((e) => log.error(`[Admin App protected layout] Error logging out: ${e?.message ?? '-'}`));
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
