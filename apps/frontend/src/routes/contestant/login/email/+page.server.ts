/**
 * # The sign-in screen's server action
 *
 * Signs a user in with the posted email address and password, and redirects.
 *
 * The load returns no data: it is what brings a client-side navigation to this page to the request hook.
 *
 * The action calls the shared password sign-in helper once and does nothing else before that call. The helper signs in, then claims the user's invitations and refreshes the session when a grant was written, and only then reads the session and applies its grant gate to the grants that reach this project, so a grant the claim wrote counts and a grant in another project does not. The helper is handed this request's own auth surface, which is what puts the session cookies on this action's response, and the claim and the read of the grants run on one data writer built for this request.
 *
 * Once the helper has admitted the session, and before the redirect, the action withdraws every count of the logout modal the request carries, so that no count a closed tab left can end the session it has signed in. A refusal keeps the count: a refused sign-in leaves a session the request already held as it was, and the request hook ends that session at the browser's next request once the count has run out.
 *
 * Every refusal of the helper is answered in one form: a failure with the helper's status, which the failure's data repeats. The page reads the data when it is rendered from a post made before its script had loaded, and shows the same message as for a post its script made.
 *
 * The posted `redirectTo` is supplied by the caller, and it is validated here and nowhere else: the page passes it on unread. A value the validator refuses is treated as absent, and the redirect then leads to the app's home.
 *
 * Tested in `page.server.test.ts`.
 */

import { fail, redirect } from '@sveltejs/kit';
import { createDataWriter } from '$lib/api/dataWriter';
import { CONTESTANT_GRANTS, passwordLogin } from '$lib/auth';
import { buildRoute, safeRedirectTarget } from '$lib/routes';
import { withdrawLogoutCount } from '$lib/server/auth/logoutCount';

/**
 * Returns no data. It exists so that a client-side navigation to this page sends a request the request hook sees, which sends a caller with a session to the app's home; see `appGates.ts`.
 *
 * @returns An empty object.
 */
export function load(): Record<string, never> {
  return {};
}

export const actions = {
  default: async (event) => {
    const { request, locals, fetch } = event;
    const data = await request.formData();
    // Caller-controlled: see `loginRedirectTarget.ts`. Rejected values fall back to the app home.
    const redirectTo = safeRedirectTarget(data.get('redirectTo') as string | null);

    let writer: ReturnType<typeof createDataWriter> | undefined;
    /** The one data writer of this request, built on the first call. */
    function requestWriter(): ReturnType<typeof createDataWriter> {
      writer ??= createDataWriter({ fetch, locals });
      return writer;
    }

    const outcome = await passwordLogin({
      context: {
        auth: locals.supabase.auth,
        getSession: locals.safeGetSession,
        claimInvitations: () => requestWriter().claimInvitations(),
        getProjectGrants: () => requestWriter().getProjectGrants()
      },
      email: data.get('email') as string,
      password: data.get('password') as string,
      allowedGrants: CONTESTANT_GRANTS,
      logLabel: 'Contestant sign-in'
    });
    if (!outcome.ok) return fail(outcome.status, { status: outcome.status });
    withdrawLogoutCount(event);
    // The override target stays interpolated rather than built: `buildRoute` resolves a NAMED route from the route map, and a validated `redirectTo` is an arbitrary relative path with no name. The leading `/{locale}/` is what keeps the result same-origin, so the validator above must run first and its rejection must fall through to the named home route.
    const home = buildRoute({ route: 'ContestantAppHome', locale: locals.currentLocale });
    return redirect(303, redirectTo ? `/${locals.currentLocale}/${redirectTo}` : home);
  }
};
