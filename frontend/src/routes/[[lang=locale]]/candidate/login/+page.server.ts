/**
 * # Candidate App login server action
 *
 * Uses Supabase Auth signInWithPassword for email/password authentication.
 * The Supabase server client from event.locals handles cookie management
 * automatically via the hooks.server.ts cookie handler.
 */

import { fail, redirect } from '@sveltejs/kit';
import { buildRoute } from '$lib/utils/route';

export const actions = {
  default: async ({ request, locals }) => {
    const data = await request.formData();
    const email = data.get('email') as string;
    const password = data.get('password') as string;
    const redirectTo = data.get('redirectTo') as string;

    const { error } = await locals.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      // Map Supabase auth errors to HTTP status codes
      // "Invalid login credentials" -> 400, "Email not confirmed" -> 403
      const status = error.message.includes('not confirmed') ? 403 : 400;
      return fail(status);
    }

    // Redirect to the requested page or candidate home
    return redirect(
      303,
      redirectTo
        ? `/${locals.currentLocale}/${redirectTo}`
        : buildRoute({
            route: 'CandAppHome',
            locale: locals.currentLocale
          })
    );
  }
};
