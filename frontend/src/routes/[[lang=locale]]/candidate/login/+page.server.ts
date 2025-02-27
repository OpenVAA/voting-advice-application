/**
 * # Candidate App login server action
 *
 * On succesfull login saves the jwt token into the cookie.
 */

import { fail, redirect } from '@sveltejs/kit';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { logDebugError } from '$lib/utils/logger';
import { buildRoute } from '$lib/utils/route';

export const actions = {
  default: async ({ cookies, request, locals, fetch }) => {
    const dataWriter = await dataWriterPromise;
    dataWriter.init({ fetch });

    const data = await request.formData();
    const username = data.get('email') as string;
    const password = data.get('password') as string;
    const redirectTo = data.get('redirectTo') as string;

    const loginResponse = await dataWriter.login({ username, password }).catch(() => undefined);
    if (!loginResponse?.authToken) return fail(400);
    const { authToken } = loginResponse;

    const userData = await dataWriter.getBasicUserData({ authToken }).catch((e) => {
      logDebugError(`Error fetching user data: ${e?.message ?? 'No error message'}`);
      return undefined;
    });
    if (!userData) return fail(500);

    // Only set the auth token if we also got the basic user data
    cookies.set('token', authToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });

    const language = userData.settings?.language;
    if (language) {
      locals.currentLocale = language;
    }

    redirect(
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
