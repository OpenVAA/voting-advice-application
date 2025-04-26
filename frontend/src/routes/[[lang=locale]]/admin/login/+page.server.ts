/**
 * # Admin App login server action
 *
 * On successful login saves the jwt token into the cookie.
 */

import { fail, redirect } from '@sveltejs/kit';
import { dataWriter as dataWriterPromise } from '$lib/api/dataWriter';
import { logDebugError } from '$lib/utils/logger';

export const actions = {
  default: async ({ cookies, request, locals, fetch }: any) => {
    const dataWriter = await dataWriterPromise;
    dataWriter.init({ fetch });

    const data = await request.formData();
    const username = data.get('email') as string;
    const password = data.get('password') as string;
    const redirectTo = data.get('redirectTo') as string;

    // First try to login and get the auth token
    const loginResponse = await dataWriter.login({ username, password }).catch((e) => {
      logDebugError(`Error during login attempt: ${e?.message ?? 'No error message'}`);
      return undefined;
    });

    if (!loginResponse?.authToken) {
      return fail(400, { type: 'error', data: { message: 'Invalid credentials' } });
    }

    const { authToken } = loginResponse;

    // Then get the user data to check the role
    const userData = await dataWriter.getBasicUserData({ authToken }).catch((e) => {
      logDebugError(`Error fetching user data: ${e?.message ?? 'No error message'}`);
      return undefined;
    });

    if (!userData) {
      return fail(500, { type: 'error', data: { message: 'Failed to fetch user data' } });
    }

    // Always set the token in the cookie
    cookies.set('token', authToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });

    // Set the language if available
    const language = userData.settings?.language;
    if (language) {
      locals.currentLocale = language;
    }

    if (userData.role !== 'admin') {
      // If not an admin, redirect to unauthorized page
      redirect(303, `/${locals.currentLocale}/admin/unauthorized`);
    }

    // If admin, redirect to dashboard
    redirect(303, redirectTo ? `/${locals.currentLocale}/${redirectTo}` : `/${locals.currentLocale}/admin`);
  }
};
