/**
 * # Admin App login server action
 *
 * A thin wrapper over the shared password-login helper, which owns the sign-in, the session read-back, the claims decode and the grant-shape gate. What stays here is what differs between the two login entry points: the grant-shape set, the redirect target and the log label. The helper is handed THIS request's own auth surface rather than making a client of its own, which is what puts the session cookies on THIS form-action response; a nested API route's `Set-Cookie` headers do not propagate back to the browser, and the redirect to the protected admin home page does not work without them.
 */

import { fail, redirect } from '@sveltejs/kit';
import { logDebugError } from '$lib/utils/logger';
import { buildRoute } from '$lib/utils/route';
import { safeRedirectTarget } from '../../loginRedirectTarget';

export const actions = {
  default: async ({ request, locals }) => {
    const data = await request.formData();
    const email = data.get('email') as string;
    const password = data.get('password') as string;
    // Caller-controlled: see `loginRedirectTarget.ts`. Rejected values fall back to the app home.
    const redirectTo = safeRedirectTarget(data.get('redirectTo') as string | null);

    // Sign in directly via the Supabase server client from hooks.server.ts.
    // This ensures session cookies are set on THIS response (not a nested API route response).
    const { error } = await locals.supabase.auth.signInWithPassword({ email, password });
    if (error) {
      logDebugError(`Admin login failed: ${error.message}`);
      return fail(400);
    }

    // Verify the session was established and check role.
    const { session, user } = await locals.safeGetSession();
    if (!session || !user) {
      logDebugError('Admin login: session not established after signIn');
      return fail(500);
    }

    // Check user has an admin role via JWT claims.
    const payload = JSON.parse(atob(session.access_token.split('.')[1]));
    const userRoles: Array<{ role: string }> = payload.user_roles ?? [];
    const isAdmin = userRoles.some((r) => ['project_admin', 'account_admin', 'super_admin'].includes(r.role));

    if (!isAdmin) {
      await locals.supabase.auth.signOut({ scope: 'local' });
      logDebugError('Unauthorized user tried to access admin app');
      return fail(403);
    }

    return redirect(
      303,
      redirectTo
        ? `/${locals.currentLocale}/${redirectTo}`
        : buildRoute({
            route: 'AdminAppHome',
            locale: locals.currentLocale
          })
    );
  }
};
