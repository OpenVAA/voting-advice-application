/**
 * # Candidate App login server action
 *
 * A thin wrapper over the shared password-login helper, which owns the sign-in, the session read-back, the claims decode and the role gate. What stays here is what differs between the two login entry points: the role set, the redirect target and the log label. The helper is handed THIS request's own auth surface rather than making a client of its own, which is what puts the session cookies on THIS form-action response; a nested API route's `Set-Cookie` headers do not propagate back to the browser, and the redirect to the protected candidate home page does not work without them.
 */

import { fail, redirect } from '@sveltejs/kit';
import { CANDIDATE_ROLES, passwordLogin } from '$lib/auth';
import { buildRoute, safeRedirectTarget } from '$lib/routes';

export const actions = {
  default: async ({ request, locals }) => {
    const data = await request.formData();
    // Caller-controlled: see `loginRedirectTarget.ts`. Rejected values fall back to the app home.
    const redirectTo = safeRedirectTarget(data.get('redirectTo') as string | null);
    const outcome = await passwordLogin({
      context: { auth: locals.supabase.auth, getSession: locals.safeGetSession },
      email: data.get('email') as string,
      password: data.get('password') as string,
      allowedRoles: CANDIDATE_ROLES,
      logLabel: 'Candidate login'
    });
    if (!outcome.ok) return fail(outcome.status);
    // The override target stays interpolated rather than built: `buildRoute` resolves a NAMED route from the route map, and a validated `redirectTo` is an arbitrary relative path with no name. The leading `/{locale}/` is what keeps the result same-origin, so the validator above must run first and its rejection must fall through to the named home route.
    const home = buildRoute({ route: 'CandAppHome', locale: locals.currentLocale });
    return redirect(303, redirectTo ? `/${locals.currentLocale}/${redirectTo}` : home);
  }
};
