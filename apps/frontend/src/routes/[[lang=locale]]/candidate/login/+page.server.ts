/**
 * # Candidate App login server action
 */

import { fail, redirect } from '@sveltejs/kit';
import { UNIVERSAL_API_ROUTES } from '$lib/api/base/universalApiRoutes.js';
import { buildRoute } from '$lib/utils/route';
import type { LoginParams, LoginResult } from '../../api/auth/login/+server';

export const actions = {
  default: async ({ request, fetch, locals }) => {
    const data = await request.formData();
    const username = data.get('email') as string;
    const password = data.get('password') as string;
    const redirectTo = data.get('redirectTo') as string;

    const response = await fetch(UNIVERSAL_API_ROUTES.login, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password, role: 'candidate' } as LoginParams)
    });

    const result = (await response.json()) as LoginResult;

    if (result.type !== 'success') return fail(result.status ?? 500);

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
