/**
 * # Admin App login server action
 *
 * Uses the Supabase server client directly (via `event.locals.supabase`) instead
 * of going through the `/api/auth/login` route. This ensures session cookies are
 * set on THIS form-action response (not a nested API-route response, whose
 * Set-Cookie headers do not propagate back to the browser), which is required
 * for the redirect to the protected admin home page to work. Mirrors the
 * candidate login action.
 */

import { fail, redirect } from '@sveltejs/kit';
import { logDebugError } from '$lib/utils/logger';
import { buildRoute } from '$lib/utils/route';

export const actions = {
  default: async ({ request, locals }) => {
    const data = await request.formData();
    const email = data.get('email') as string;
    const password = data.get('password') as string;
    const redirectTo = data.get('redirectTo') as string;

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
