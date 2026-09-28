/* eslint-disable func-style -- SvelteKit hooks use typed const exports by convention */
import { configureLogger, log } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { API_ROOT } from '$lib/api/base/universalApiRoutes';
import { getLocale } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { buildRoute, isProtectedRoute, resolveAppGate, ROUTE } from '$lib/routes';
import { createSafeGetSession } from '$lib/supabase/safeGetSession';
import { createSupabaseServerClient } from '$lib/supabase/server';
import { constants } from '$lib/utils/constants';
import { resolveLogLevel } from '$lib/utils/logLevel';
import type { Handle, HandleServerError } from '@sveltejs/kit';

// Configure the shared logger for the SSR module graph, once at server start and before any handler runs. `hooks.client.ts` makes the same call for the browser module graph, so both run at the same level.
// Resolve, configure, then emit, in that order: the logger drops records while its threshold is still `'silent'`, so a problem reported before `configureLogger` would be lost.
const { level: logLevel, problem: logLevelProblem } = resolveLogLevel(
  constants.PUBLIC_LOG_LEVEL,
  import.meta.env.DEV,
  constants.PUBLIC_DEBUG
);
configureLogger({ level: logLevel });
if (logLevelProblem) {
  // An unset variable falls back to its documented default and is reported at `info`; a value outside the vocabulary is a misconfiguration and is reported at `error`.
  const emit = logLevelProblem.reason === 'invalid' ? log.error : log.info;
  emit('PUBLIC_LOG_LEVEL is unusable; the logger fell back to a default level.', {
    ...logLevelProblem,
    level: logLevel
  });
}

const NORMALIZED_API_ROOT = API_ROOT.replace(/^\/*/, '/');

// The project id this server queries, published on the HTML root so a caller can observe it.
// The value is already public: it carries the `PUBLIC_` prefix and ships in the client bundle. Publish no other variable here, and read this one only through `constants`.
// `.trim().toLowerCase()` is the adapter's whole normalisation, so this equals the id every query is scoped by. The adapter's resolver is not called because it throws on an unusable value, which would turn every page render into a 500; such a value reaches the document as the empty string, which reads as a mismatch.
const SERVED_PROJECT_ID = constants.PUBLIC_PROJECT_ID.trim().toLowerCase();

/**
 * Supabase session handler.
 * Creates a per-request server client and attaches it, with `safeGetSession`, to `event.locals`. `safeGetSession` verifies each access token once per request, so the gate below and the route loaders can all call it.
 * Runs first so every later handler can use `event.locals.supabase`.
 */
const supabaseHandle: Handle = async ({ event, resolve }) => {
  const supabase = createSupabaseServerClient(event);

  event.locals.supabase = supabase;
  event.locals.safeGetSession = createSafeGetSession(supabase);

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    }
  });
};

/**
 * Paraglide i18n middleware handler.
 * Sets `currentLocale` on `event.locals` and replaces `%lang%` and `%projectId%` in the HTML.
 * `app.html` declares both placeholders above `%sveltekit.body%`, so they arrive in the same chunk and one transform answers both.
 */
const paraglideHandle: Handle = ({ event, resolve }) =>
  paraglideMiddleware(event.request, ({ request: localizedRequest, locale }) => {
    event.request = localizedRequest;
    event.locals.currentLocale = locale;
    return resolve(event, {
      transformPageChunk: ({ html }) => html.replace('%lang%', locale).replace('%projectId%', SERVED_PROJECT_ID)
    });
  });

/**
 * Application session-gate handler.
 *
 * Redirects a signed-in caller away from a gated application's login page, and a caller with no session away from its `(protected)` routes. The gated applications, the Candidate App and the Admin App, are the rows of `APP_GATES` in `$lib/routes`; this handler loops over that table and names no application itself.
 *
 * - The session is read only after a row has matched, so public voter pages make no session round trip.
 * - This is a session gate, not a role gate. Whether the signed-in user may act in the application is decided by that application's protected layout and form actions.
 * - Both redirect targets are built by `buildRoute` from a route key in the row, and Paraglide adds the locale prefix, as in the protected layouts' own login redirects.
 */
const appGateHandle: Handle = async ({ event, resolve }) => {
  const { url, route } = event;
  const locale = getLocale();
  const pathname = url.pathname;

  // Skip non-route and API requests. The API test is a prefix test on the pathname because it guards a served URL prefix, not a route id; every gate decision below reads the route id.
  if (route?.id == null || pathname.startsWith(NORMALIZED_API_ROOT)) {
    return resolve(event);
  }
  // Bound after the guard, so it narrows to `string`.
  const routeId = route.id;

  // The gate is matched on the route id, which carries no base path, no locale prefix and no param values, so a subpath deployment or a param containing an application's name cannot misfire it. No match means a public voter route.
  const gate = resolveAppGate(routeId);
  if (!gate) return resolve(event);

  const { session } = await event.locals.safeGetSession();

  if (session && routeId === ROUTE[gate.loginRoute]) {
    const { status, route: target, params } = gate.whenAuthenticatedOnLogin;
    redirect(status, buildRoute({ route: target, locale, ...params({ redirectTo: '' }) }));
  }
  if (!session && isProtectedRoute(routeId)) {
    const { status, route: target, params } = gate.whenUnauthenticatedInProtectedGroup;
    // The requested path, which the candidate row carries back as `redirectTo` and the admin row ignores. It is read off the pathname because the route id has placeholders instead of values. `redirectTo` is not a route param, so `buildRoute` puts it in the query string, percent-encoded.
    const cleanPath = pathname.replace(new RegExp(`^/${locale}`), '');
    redirect(status, buildRoute({ route: target, locale, ...params({ redirectTo: cleanPath.substring(1) }) }));
  }

  return resolve(event);
};

export const handle: Handle = sequence(supabaseHandle, paraglideHandle, appGateHandle);

export const handleError: HandleServerError = async ({ error }) => {
  console.error('Server error:', error);
  return { message: '500' };
};
