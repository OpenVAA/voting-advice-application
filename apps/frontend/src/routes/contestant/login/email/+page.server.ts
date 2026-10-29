/**
 * # The sign-in screen's server action
 *
 * Signs a user in with the posted email address and password, and redirects.
 *
 * The action calls the shared password sign-in helper once and does nothing before that call. The helper signs in, then claims the user's invitations and refreshes the session when a grant was written, and only then reads the session and applies its grant gate, so the gate reads a token that lists a grant the claim wrote. The helper is handed this request's own auth surface, which is what puts the session cookies on this action's response, and the claim runs on a data writer built for this request.
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

export const actions = {
  default: async ({ request, locals, fetch }) => {
    const data = await request.formData();
    // Caller-controlled: see `loginRedirectTarget.ts`. Rejected values fall back to the app home.
    const redirectTo = safeRedirectTarget(data.get('redirectTo') as string | null);
    const outcome = await passwordLogin({
      context: {
        auth: locals.supabase.auth,
        getSession: locals.safeGetSession,
        claimInvitations: () => createDataWriter({ fetch, locals }).claimInvitations()
      },
      email: data.get('email') as string,
      password: data.get('password') as string,
      allowedGrants: CONTESTANT_GRANTS,
      logLabel: 'Contestant sign-in'
    });
    if (!outcome.ok) return fail(outcome.status, { status: outcome.status });
    // The override target stays interpolated rather than built: `buildRoute` resolves a NAMED route from the route map, and a validated `redirectTo` is an arbitrary relative path with no name. The leading `/{locale}/` is what keeps the result same-origin, so the validator above must run first and its rejection must fall through to the named home route.
    const home = buildRoute({ route: 'ContestantAppHome', locale: locals.currentLocale });
    return redirect(303, redirectTo ? `/${locals.currentLocale}/${redirectTo}` : home);
  }
};
