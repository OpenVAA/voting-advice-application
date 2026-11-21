/**
 * # Admin App login server action
 *
 * A thin wrapper over the shared password-login helper, which owns the sign-in, the session read-back, the claims decode and the grant-shape gate. What stays here is what differs between the two login entry points: the grant-shape set, the redirect target and the log label. The helper is handed THIS request's own auth surface rather than making a client of its own, which is what puts the session cookies on THIS form-action response; a nested API route's `Set-Cookie` headers do not propagate back to the browser, and the redirect to the protected admin home page does not work without them.
 *
 * The context also carries the claim of the user's invitations, issued on the same request's client. The helper claims after the sign-in and refreshes the session when a grant was written. It carries the read of the user's grants that reach this project too, so the gate admits an admin grant on this project, on its account or at global scope, and refuses an admin of another project only.
 *
 * Once the helper has admitted the session, and before the redirect, the action withdraws every count of the logout modal the request carries, so that no count a closed tab left can end the session it has signed in. A refusal keeps the count: a refused sign-in leaves a session the request already held as it was, and the request hook ends that session at the browser's next request once the count has run out.
 *
 * The load brings a client-side navigation to this page to the request hook, and answers why the visitor was sent here when the hook has just ended the session at the end of a logout count.
 */

import { fail, redirect } from '@sveltejs/kit';
import { createDataWriter } from '$lib/api/dataWriter';
import { ADMIN_GRANTS, passwordLogin } from '$lib/auth';
import { LOGOUT_DEADLINE_SETTLED } from '$lib/auth/logoutDeadline';
import { COOKIE } from '$lib/cookies';
import { buildRoute, safeRedirectTarget } from '$lib/routes';
import { withdrawLogoutDeadline } from '$lib/server/auth/logoutDeadline';
import type { LoginError } from '$lib/admin/utils/loginError';

/**
 * The login page's load serves two purposes.
 *
 * - A client-side navigation to this page sends a request the request hook sees, which sends a caller with a session to the app's home; see `appGates.ts`.
 * - It answers why the visitor was sent here when the request hook has just ended the session at the end of a logout count. The hook writes {@link LOGOUT_DEADLINE_SETTLED} into `COOKIE.logoutPending` in the response that signs out, the gate sends the request here with `errorMessage=loginFailed`, and the browser's request for this page carries the value; the root layout removes it only after this page has loaded. The page shows this reason before the address bar's, which says less. The load reads that one cookie and no session.
 *
 * Tested in `page.server.test.ts`.
 *
 * @returns `{ signedOutReason: 'loggedOutAutomatically' }` when the request carries the settled value, and an empty object otherwise.
 */
export function load({ cookies }): { signedOutReason?: Extract<LoginError, 'loggedOutAutomatically'> } {
  return cookies.get(COOKIE.logoutPending) === LOGOUT_DEADLINE_SETTLED
    ? { signedOutReason: 'loggedOutAutomatically' }
    : {};
}

export const actions = {
  default: async (event) => {
    const { request, locals, fetch } = event;
    const data = await request.formData();
    // Caller-controlled: see `loginRedirectTarget.ts`. Rejected values fall back to the app home.
    const redirectTo = safeRedirectTarget(data.get('redirectTo') as string | null);
    const outcome = await passwordLogin({
      context: {
        auth: locals.supabase.auth,
        getSession: locals.safeGetSession,
        claimInvitations: () => createDataWriter({ fetch, locals }).claimInvitations(),
        getProjectGrants: () => createDataWriter({ fetch, locals }).getProjectGrants()
      },
      email: data.get('email') as string,
      password: data.get('password') as string,
      allowedGrants: ADMIN_GRANTS,
      logLabel: 'Admin login'
    });
    if (!outcome.ok) return fail(outcome.status);
    withdrawLogoutDeadline(event);
    // The override target stays interpolated rather than built: `buildRoute` resolves a NAMED route from the route map, and a validated `redirectTo` is an arbitrary relative path with no name. The leading `/{locale}/` is what keeps the result same-origin, so the validator above must run first and its rejection must fall through to the named home route.
    const home = buildRoute({ route: 'AdminAppHome', locale: locals.currentLocale });
    return redirect(303, redirectTo ? `/${locals.currentLocale}/${redirectTo}` : home);
  }
};
