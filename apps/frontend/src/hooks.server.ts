/* eslint-disable func-style -- SvelteKit hooks use typed const exports by convention */
import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { API_ROOT } from '$lib/api/base/universalApiRoutes';
import { getLocale } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { createSupabaseServerClient } from '$lib/supabase/server';

const NORMALIZED_API_ROOT = API_ROOT.replace(/^\/*/, '/');

/**
 * Supabase session handler.
 * Creates a per-request server client and attaches it (plus safeGetSession) to event.locals.
 * Runs FIRST so all subsequent handlers can use event.locals.supabase.
 */
const supabaseHandle: Handle = async ({ event, resolve }) => {
  const supabase = createSupabaseServerClient(event);

  event.locals.supabase = supabase;
  event.locals.safeGetSession = async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) return { session: null, user: null };
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();
    if (error) return { session: null, user: null };
    return { session, user };
  };

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    }
  });
};

/**
 * Paraglide i18n middleware handler.
 * Sets currentLocale on event.locals and replaces %lang% in HTML.
 */
const paraglideHandle: Handle = ({ event, resolve }) =>
  paraglideMiddleware(event.request, ({ request: localizedRequest, locale }) => {
    event.request = localizedRequest;
    event.locals.currentLocale = locale;
    return resolve(event, {
      transformPageChunk: ({ html }) => html.replace('%lang%', locale)
    });
  });

/**
 * Candidate auth redirect handler (Supabase session).
 * Redirects logged-in users away from login and unauthenticated users to login.
 */
const candidateAuthHandle: Handle = async ({ event, resolve }) => {
  const { url, route } = event;
  const locale = getLocale();
  const pathname = url.pathname;

  // Skip non-route and API requests
  if (route?.id == null || pathname.startsWith(NORMALIZED_API_ROOT)) {
    return resolve(event);
  }

  // Handle candidate auth redirects
  if (pathname.includes('/candidate')) {
    const { session } = await event.locals.safeGetSession();
    if (session && pathname.endsWith('candidate/login')) {
      redirect(303, `/${locale}/candidate`);
    }
    if (!session && route.id.includes('(protected)')) {
      const cleanPath = pathname.replace(new RegExp(`^/${locale}`), '');
      redirect(303, `/${locale}/candidate/login?redirectTo=${cleanPath.substring(1)}`);
    }
  }

  return resolve(event);
};

export const handle: Handle = sequence(supabaseHandle, paraglideHandle, candidateAuthHandle);

export const handleError: HandleServerError = async ({ error }) => {
  console.error('Server error:', error);
  return { message: '500' };
};
