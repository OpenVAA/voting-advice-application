/**
 * # Admin App login server action
 *
 * Uses DataWriter adapter for email/password authentication with admin role verification.
 */

import { fail, redirect } from '@sveltejs/kit';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { logDebugError } from '$lib/utils/logger';
import { buildRoute } from '$lib/utils/route';

export const actions = {
  default: async ({ request, locals, fetch }) => {
    const data = await request.formData();
    const username = data.get('email') as string;
    const password = data.get('password') as string;
    const redirectTo = data.get('redirectTo') as string;

    const dataWriter = await dataWriterPromise;
    dataWriter.init({ fetch, serverClient: locals.supabase, locale: locals.currentLocale });

    try {
      const result = await dataWriter.login({ username, password });
      if (result.type !== 'success') return fail(400);
    } catch (e) {
      logDebugError(`Admin login error: ${e instanceof Error ? e.message : e}`);
      return fail(400);
    }

    // Verify the user has admin role
    try {
      const userData = await dataWriter.getBasicUserData({ authToken: '' });
      if (userData.role !== 'admin') {
        await dataWriter.logout({ authToken: '' }).catch(() => {});
        return fail(403);
      }
    } catch (e) {
      logDebugError(`Error verifying admin role: ${e instanceof Error ? e.message : e}`);
      return fail(500);
    }

    redirect(
      303,
      redirectTo
        ? `/${locals.currentLocale}/${redirectTo}`
        : buildRoute({ route: 'AdminAppHome', locale: locals.currentLocale })
    );
  }
};
