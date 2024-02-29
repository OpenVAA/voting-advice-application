import type {Handle, HandleServerError} from '@sveltejs/kit';
import {defaultLocale, loadTranslations, locales} from '$lib/i18n';
import {isLocale, matchLocale, parseAcceptedLanguages} from '$lib/i18n/utils';
import {logDebugError} from '$lib/utils/logger';

// Handle and handleError based on sveltekit-i18n examples:
// https://github.com/sveltekit-i18n/lib/blob/master/examples/locale-router-advanced/src/hooks.server.js

const ROUTE_RE = new RegExp(/^\/([^./]*)(?:\/[^.]*)?$/);

export const handle: Handle = (async ({event, resolve}) => {
  const {url, request, isDataRequest} = event;
  const {pathname} = url;
  const supportedLocales = locales.get();

  // logDebugError(
  //   `Handle: start for ${pathname} with redirect '${request.headers.get('prevent-redirect')}'`
  // );

  /////////////////////////////////////////////////////
  // 1. Try to get route param from url and
  //    handle non-route requests
  /////////////////////////////////////////////////////

  let locale: string | undefined;
  let cleanPath = pathname;

  // NB. We cannot rely on `event.params` because it does not work on all occasions
  const match = pathname.match(ROUTE_RE);

  // If this request is not a route request, resolve normally
  if (!match) {
    // logDebugError(`Handle: resolve non-route request: ${pathname}`);
    return resolve(event);
    // Try to find locale param
  } else if (isLocale(match[1])) {
    locale = match[1];
    cleanPath = cleanPath.replace(RegExp(`^/${locale}`), '') || '/';
    // logDebugError(`Handle: found locale '${locale}' with clean path '${cleanPath}'`);
  }

  /////////////////////////////////////////////////////
  // 2. Get preferred locale from request headers
  /////////////////////////////////////////////////////

  let preferredLocale: string | undefined;
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const preferredLocales = parseAcceptedLanguages(acceptLanguage);
    preferredLocale = matchLocale(preferredLocales, supportedLocales);
  }
  // logDebugError(`Handle: preferredLocale: ${preferredLocale}`);

  /////////////////////////////////////////////////////
  // 3. Handle requests with a proper route param
  /////////////////////////////////////////////////////

  // If there was a locale in the route params, check if it's supported.
  if (locale && supportedLocales.includes(locale)) {
    // We want to redirect the default locale to the "no-locale" path
    // if it's also the user's preference, i.e., if we can assume that
    // the locale is chosen by default. We also do that if there's only
    // one locale available.

    // TODO: The locale redirect breaks the load function in *.server.ts files
    /*
    if (
      !request.headers.get('prevent-redirect') &&
      (supportedLocales.length === 1 ||
        (locale === defaultLocale && (!preferredLocale || locale === preferredLocale)))
    ) {
      // logDebugError(`Handle: redirect default locale to no-locale path: ${cleanPath}`);
      return new Response(undefined, {
        headers: {location: cleanPath},
        status: 301
      });
    }
    */

    // Otherwise we just serve the page
    // Add html `lang` attribute
    // logDebugError(`Handle: resolve with proper locale '${locale}' in route param`);
    return resolve(
      {
        ...event,
        locals: {
          currentLocale: locale,
          preferredLocale
        }
      },
      {
        transformPageChunk: ({html}) => html.replace('%lang%', `${locale}`)
      }
    );
  }

  /////////////////////////////////////////////////////
  // 4. Handle requests with no valid route params
  /////////////////////////////////////////////////////

  // At this point, either the locale was not supported or not in the
  // route params at all. Note, that this may be an intentional request
  // for the default locale as well if it's the one preferred by the user

  // If this is not a data request, we'll try find the best match
  if (!isDataRequest) {
    // First, try a soft match
    if (locale) locale = matchLocale(locale, supportedLocales);
    // Then use the possible user preference (note that these are all supported)
    locale ??= preferredLocale ?? defaultLocale;
  } else {
    // If this is aDataRequest, use the default locale
    locale = defaultLocale;
  }

  // TODO: The locale redirect breaks the load function in *.server.ts files
  // Temporary solution is to always redirect to the default locale
  return new Response(undefined, {
    headers: {location: `/${locale}${cleanPath}`},
    status: 301
  });

  /*
  /////////////////////////////////////////////////////
  // 5. Redirect if we switched to a non-default locale
  /////////////////////////////////////////////////////

  if (locale !== defaultLocale) {
    // logDebugError(`Handle: redirect locale ${locale} to ${locale}${cleanPath}`);
    // 301 redirect
    return new Response(undefined, {
      headers: {location: `/${locale}${cleanPath}`},
      status: 301
    });
  }

  /////////////////////////////////////////////////////
  // 6. Serve the default locale
  /////////////////////////////////////////////////////

  const path = cleanPath.replace(/\/$/, '');
  const redirectTo = `${origin}/${locale}${path}${
    isDataRequest ? '/__data.json?x-sveltekit-invalidated=100' : ''
  }`;

  // We want to prevent redirect to fetch data for the default locale
  request.headers.set('prevent-redirect', '1');

  // Fetch the redirected route
  const response = await fetch(redirectTo, request);

  // Get response body and set html headers
  const data = await response.text();

  // logDebugError(`Handle: fetch ${redirectTo} for the default locale ${locale}`);
  // Serve the redirected route.
  // In this case we don't have to set the html 'lang' attribute
  // as the default locale is already included in our app.html.
  return new Response(data, {
    ...response,
    headers: {
      ...response.headers,
      'Content-Type': isDataRequest ? 'application/json' : 'text/html'
    }
  });
  */
}) satisfies Handle;

export const handleError = (async ({error, event}) => {
  const {locals} = event;
  const currentLocale = locals?.currentLocale;
  logDebugError('handleError', error);
  if (currentLocale) await loadTranslations(currentLocale, 'error');
  return {
    message: '500'
  };
}) satisfies HandleServerError;
