/**
 * Load the data for a logged-in admin user.
 * - No session in the page data redirects to the login page
 * - A read of the user data that answers nothing asks the load's client whether a session is left: none redirects to the login page, as a session ended elsewhere; one left, or no answer, ends on the error page, and nobody is signed out
 * - A user the server load did not admit is signed out and redirected to the login page, before anything is read. Admission is the server load's match of the verified session's grants against `ADMIN_GRANTS`. When the sign-out fails it ends on the error page, unless, in the browser, no session is left, which redirects as a sign-out that worked does. In the browser, the sign-out is announced to the browser's other tabs, `start` before it and `end` once it has settled, worked or failed, so that the tabs it signs out name another tab as the cause; and a sign-out that ended the session removes the Contestant App's drafts before the redirect
 * - The user data is the server load's during server rendering. In the browser it is read again with the tab's own client, so that a read that fails there is answered as above
 * - The gate the server load decided is passed on to the layout, which renders its view in place of the page
 */

import { log } from '@openvaa/app-shared';
import { error, redirect } from '@sveltejs/kit';
import { browser } from '$app/environment';
import { createDataWriter } from '$lib/api/dataWriter';
import { getUserData } from '$lib/auth';
import { announceLogout } from '$lib/auth/logoutAnnouncement';
import { discardContestantDrafts } from '$lib/contexts/contestant/contestantDrafts';
import { t } from '$lib/i18n';
import { getLocale } from '$lib/paraglide/runtime';
import { buildRoute } from '$lib/routes';
import type { LoginError } from '$lib/admin/utils/loginError';

export async function load({ data, fetch, parent }) {
  const lang = getLocale();
  const { session, supabaseClient } = await parent();

  if (!session) {
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

  if (!data.admitted) return await handleError('userNotAuthorized');

  const userData = browser ? await getUserData({ fetch, client: supabaseClient }, { parent }) : data.user;

  if (!userData) {
    const sessionGone = await createDataWriter({ fetch, client: supabaseClient }).isSessionGone();
    if (sessionGone)
      return redirect(
        307,
        buildRoute({
          route: 'AdminAppLogin',
          locale: lang,
          errorMessage: 'loginFailed'
        })
      );
    // Not a redirect: a session is left, or the client could not tell, and the gate sends a live session straight back from the login page, so this load would run again.
    return error(503, { message: t('error.default') });
  }

  return { userData, gate: data.gate };

  /**
   * Call logout and redirect to the login page with an error message. A logout that fails is logged and ends on the error page, unless, in the browser, no session is left: a live session is sent straight back from the login page, so a redirect would never end. In the browser, the logout announces its `start` to the browser's other tabs before the sign-out and its `end` once the sign-out has settled, before the session is read; and once the session has ended, the Contestant App's drafts are removed before the redirect. On the server nothing is announced.
   */
  async function handleError(code: LoginError): Promise<never> {
    // The logout writer comes from the factory on the SAME client the load itself used, rather than re-configuring a shared one mid-error-path.
    const dataWriter = createDataWriter({ fetch, client: supabaseClient });
    if (browser) announceLogout('start');
    const signedOut = await dataWriter.logout().then(
      () => true,
      (e) => {
        log.error(`[Admin App protected layout] Error logging out: ${e?.message ?? '-'}`);
        return false;
      }
    );
    if (browser) announceLogout('end');
    // Asked in the browser alone. There the writer's sign-out calls the logout endpoint first, whose server client clears the cookies when the auth service's answer is what failed, and the tab's client reads them gone. The universal client on the server writes no cookies, so after its own failed sign-out it answers no session while the browser still holds one, and a redirect would come straight back.
    const sessionEnded = signedOut || (browser && (await dataWriter.isSessionGone()));
    if (!sessionEnded) error(403, { message: t('error.403') });
    // Removed here rather than by a subscriber: this load can run before the Admin App's layout has mounted, on a link from a page with no subscriber, and the client reports no sign-out that failed. The server cannot reach the browser's storage.
    if (browser) discardContestantDrafts();
    redirect(
      307,
      buildRoute({
        route: 'AdminAppLogin',
        locale: lang,
        errorMessage: code
      })
    );
  }
}
