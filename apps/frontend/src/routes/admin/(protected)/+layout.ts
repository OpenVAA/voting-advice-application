/**
 * Load the data for a logged-in admin user.
 * - No session in the page data redirects to the login page
 * - A read of the user data that answers nothing asks the load's client whether a session is left: none redirects to the login page, as a session ended elsewhere; one left, or no answer, ends on the error page, and nobody is signed out
 * - A user the server load did not admit is signed out and redirected to the login page, before anything is read. Admission is the server load's match of the verified session's grants against `ADMIN_GRANTS`. When the sign-out fails it ends on the error page, unless, in the browser, no session is left, which redirects as a sign-out that worked does. In the browser, the sign-out is announced to the browser's other tabs, `start` before it and `end` once it has settled, worked or failed, so that the tabs it signs out name another tab as the cause; and a sign-out that ended the session removes the Contestant App's drafts before the redirect
 * - The user data is the server load's during server rendering. In the browser it is read again with the tab's own client, so that a read that fails there is answered as above
 * - The gate the server load decided is passed on to the layout, which renders its view in place of the page
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
   * Call logout and redirect to the login page with an error message. A logout that fails is logged and ends on the error page, unless, in the browser, no session is left: a live session is sent straight back from the login page, so a redirect would never end. In the browser, the logout announces its `start` to the browser's other tabs before the sign-out and its `end` once the sign-out has settled, before the session is read; and once the session has ended, the Contestant App's drafts are removed before the redirect. On the server nothing is announced.
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
