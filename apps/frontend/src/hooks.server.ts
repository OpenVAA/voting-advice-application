/* eslint-disable func-style -- SvelteKit hooks use typed const exports by convention */
import { redirect } from '@sveltejs/kit';
import { API_ROOT } from '$lib/api/base/universalApiRoutes';
import { AUTH_TOKEN_KEY } from '$lib/auth';
import { getLocale } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import type { Handle, HandleServerError } from '@sveltejs/kit';

const NORMALIZED_API_ROOT = API_ROOT.replace(/^\/*/, '/');

const paraglideHandle: Handle = ({ event, resolve }) =>
  paraglideMiddleware(event.request, ({ request: localizedRequest, locale }) => {
    event.request = localizedRequest;
    return resolve(event, {
      transformPageChunk: ({ html }) => html.replace('%lang%', locale)
    });
  });

const candidateAuthHandle: Handle = async ({ event, resolve }) => {
  const { url, route, cookies } = event;
  const locale = getLocale();
  const pathname = url.pathname;

  // Skip non-route and API requests
  if (route?.id == null || pathname.startsWith(NORMALIZED_API_ROOT)) {
    return resolve(event);
  }

  // Handle candidate auth redirects
  if (pathname.includes('/candidate')) {
    const token = cookies.get(AUTH_TOKEN_KEY);
    if (token && pathname.endsWith('candidate/login')) {
      redirect(303, `/${locale}/candidate`);
    }
    if (!token && route.id.includes('(protected)')) {
      const cleanPath = pathname.replace(new RegExp(`^/${locale}`), '');
      redirect(303, `/${locale}/candidate/login?redirectTo=${cleanPath.substring(1)}`);
    }
  }

  return resolve(event);
};

export const handle: Handle = async ({ event, resolve }) => {
  return paraglideHandle({
    event,
    resolve: (event) => candidateAuthHandle({ event, resolve })
  });
};

export const handleError: HandleServerError = async ({ error }) => {
  console.error('Server error:', error);
  return { message: '500' };
};
