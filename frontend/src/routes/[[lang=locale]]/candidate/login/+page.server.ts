/**
 * # Candidate App login server action
 *
 * Uses DataWriter adapter for email/password authentication.
 * The Supabase adapter handles session cookie management internally.
 */

import { fail, redirect } from '@sveltejs/kit';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { logDebugError } from '$lib/utils/logger';
import { buildRoute } from '$lib/utils/route';

export const actions = {
  default: async ({ request, locals, fetch }) => {
    const data = await request.formData();
    const email = data.get('email') as string;
    const password = data.get('password') as string;
    const redirectTo = data.get('redirectTo') as string;

    const dataWriter = await dataWriterPromise;
    dataWriter.init({ fetch, serverClient: locals.supabase, locale: locals.currentLocale });

    try {
      const result = await dataWriter.login({ username: email, password });
      if (result.type !== 'success') return fail(400);
    } catch (e) {
      logDebugError(`Login error: ${e instanceof Error ? e.message : e}`);
      return fail(400);
    }

    // Verify the user has candidate role
    try {
      const userData = await dataWriter.getBasicUserData({ authToken: '' });
      if (userData.role !== 'candidate') {
        // Wrong role -- log out and reject
        await dataWriter.logout({ authToken: '' }).catch(() => {});
        return fail(403);
      }
    } catch (e) {
      logDebugError(`Error verifying user role: ${e instanceof Error ? e.message : e}`);
      return fail(500);
    }

    // Redirect to the requested page or candidate home
    redirect(
      303,
      redirectTo
        ? `/${locals.currentLocale}/${redirectTo}`
        : buildRoute({ route: 'CandAppHome', locale: locals.currentLocale })
    );
  }
};
