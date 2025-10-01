import { API_ROOT } from '$lib/api/base/universalApiRoutes';
import { AUTH_TOKEN_KEY } from '$lib/auth';
import { defaultLocale, loadTranslations, locales } from '$lib/i18n';
import { matchLocale, parseAcceptedLanguages } from '$lib/i18n/utils';
import { logDebugError } from '$lib/utils/logger';
import type { Handle, HandleServerError } from '@sveltejs/kit';

// Handle and handleError based on sveltekit-i18n examples: https://github.com/sveltekit-i18n/lib/blob/master/examples/locale-router-advanced/src/hooks.server.js

/** Set to `true` to show debug log in console */
const DEBUG = false;

/** Normalize starting slashes */
const NORMALIZED_API_ROOT = API_ROOT.replace(/^\/*/, '/');

export const handle: Handle = (async ({ event, resolve }) => {
  const { params, route, url, request, isDataRequest } = event;
  const { pathname, search } = url;
  const requestedLocale = params.lang;

  const supportedLocales = locales.get();
  let cleanPath = requestedLocale ? pathname.replace(new RegExp(`^/${requestedLocale}`, 'i'), '') : pathname;
  if (cleanPath === '') cleanPath = '/';

  debug('Route: START', { params, pathname, isDataRequest, route });

  //////////////////////////////////////////////////////////////////////////
  // 1. Handle non-route requests
  //////////////////////////////////////////////////////////////////////////

  // If this request is not a route request, resolve normally
  // NB. If defining API routes that should return json, test cleanPath here and resolve
  if (route?.id == null || pathname == null || pathname.startsWith(NORMALIZED_API_ROOT)) {
    debug('Route: RESOLVE non-route request');
    return resolve(event);
  }

  //////////////////////////////////////////////////////////////////////////
  // 2. Figure out which locale to serve
  //////////////////////////////////////////////////////////////////////////

  let preferredLocale: string | undefined;
  let servedLocale: string | undefined;

  // Get preferred locale from request headers
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const preferredLocales = parseAcceptedLanguages(acceptLanguage);
    preferredLocale = matchLocale(preferredLocales, supportedLocales);
  }

  if (supportedLocales.length === 1) {
    // No need for locale matching if there's only one locale
    servedLocale = defaultLocale;
  } else if (requestedLocale) {
    // We use soft locale matching for route parameters, so we need to map the param to a supported one
    servedLocale = matchLocale(requestedLocale, supportedLocales);
  }
  // If we still don't have a locale use the preferred one or the default one
  servedLocale ??= preferredLocale ?? defaultLocale;
  debug(
    `Route: LOCALE parsed to ${servedLocale} • PATH to '${cleanPath}' (requested ${requestedLocale}, preferred ${preferredLocale})`
  );

  //////////////////////////////////////////////////////////////////////////
  // 3. Redirect if the locale param is not the same as the served locale
  //////////////////////////////////////////////////////////////////////////

  if (requestedLocale !== servedLocale) {
    debug(`Route: REDIRECT to locale ${servedLocale}`);
    return new Response(undefined, {
      headers: { location: `/${servedLocale}${cleanPath}${search}` },
      status: 301
    });
  }

  //////////////////////////////////////////////////////////////////////////
  // 4. Handle candidate requests
  //////////////////////////////////////////////////////////////////////////

  if (pathname.startsWith(`/${servedLocale}/candidate`)) {
    const token = event.cookies.get(AUTH_TOKEN_KEY);

    if (token && pathname.endsWith('candidate/login')) {
      debug('Route: REDIRECT to home page');
      return new Response(undefined, {
        headers: { location: `/${servedLocale}/candidate` },
        status: 303
      });
    }

    if (!token && route.id.includes('(protected)')) {
      debug('Route: REDIRECT to login page');
      return new Response(undefined, {
        headers: { location: `/${servedLocale}/candidate/login?redirectTo=${cleanPath.substring(1)}` },
        status: 303
      });
    }
  }

  //////////////////////////////////////////////////////////////////////////
  // 5. Serve content in the requested locale
  //////////////////////////////////////////////////////////////////////////

  debug(`Route: SERVE with proper locale ${servedLocale}`);
  return resolve(
    {
      ...event,
      locals: {
        currentLocale: servedLocale,
        preferredLocale
      }
    },
    {
      transformPageChunk: ({ html }) => html.replace('%lang%', `${servedLocale}`)
    }
  );
}) satisfies Handle;

export const handleError = (async ({ error, event }) => {
  const { locals } = event;
  const currentLocale = locals?.currentLocale;
  logDebugError('handleError', error);
  if (currentLocale) await loadTranslations(currentLocale, 'error');
  return {
    message: '500'
  };
}) satisfies HandleServerError;

/** Show debug message if `DEBUG` is `true` */
function debug(message: unknown, error?: unknown) {
  if (DEBUG) logDebugError(message, error);
}
