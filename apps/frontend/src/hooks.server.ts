/* eslint-disable func-style -- SvelteKit hooks use typed const exports by convention */
import { configureLogger, log } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { building, dev } from '$app/environment';
import { env as privateEnv } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import {
  cookieValues,
  LOGOUT_DEADLINE_SETTLED,
  LOGOUT_PENDING_MAX_AGE_SECONDS,
  logoutDeadlineState,
  removalDomainsOf
} from '$lib/auth/logoutDeadline';
import { COOKIE } from '$lib/cookies';
import { getLocale } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { buildRoute, isApiRoute, isProtectedRoute, loginRedirectTargetOf, resolveAppGate, ROUTE } from '$lib/routes';
import { analyticsConfigProblems } from '$lib/server/analytics/env';
import { createInFlightCounter, registerShutdownLog } from '$lib/server/shutdown/shutdownLog';
import { missingRequiredEnv } from '$lib/server/startup/requiredEnv';
import { createSafeGetSession } from '$lib/supabase/safeGetSession';
import { createSupabaseServerClient } from '$lib/supabase/server';
import { constants } from '$lib/utils/constants';
import { resolveLogLevel } from '$lib/utils/logLevel';
import type { Handle, HandleServerError, ServerInit } from '@sveltejs/kit';

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

// Report each analytics configuration problem by variable name, now that the logger is configured. Any problem resolves the provider to `none`, so nothing is sent. The fields never carry the key's or the host's value.
for (const problem of analyticsConfigProblems) {
  log.error('The analytics configuration is unusable; no analytics events are sent.', { ...problem });
}

// The project id this server queries, published on the HTML root so a caller can observe it.
// The value is already public: it carries the `PUBLIC_` prefix and ships in the client bundle. Publish no other variable here, and read this one only through `constants`.
// `.trim().toLowerCase()` is the adapter's whole normalisation, so this equals the id every query is scoped by. The adapter's resolver is not called because it throws on an unusable value, which would turn every page render into a 500; such a value reaches the document as the empty string, which reads as a mismatch.
const SERVED_PROJECT_ID = constants.PUBLIC_PROJECT_ID.trim().toLowerCase();

/** The requests this server is handling, read by the line it writes as it exits. */
const inFlight = createInFlightCounter();

/**
 * In-flight request counter.
 * Counts the request from before `resolve` until it returns, so the line written at shutdown can name the requests in flight when the stop signal arrived. A streamed body can still be sending after `resolve` returns, so the count is approximate.
 * Runs first so it counts every request, including those a later handler redirects.
 */
const inFlightHandle: Handle = async ({ event, resolve }) => {
  inFlight.enter();
  try {
    return await resolve(event);
  } finally {
    inFlight.leave();
  }
};

/**
 * Supabase session handler.
 * Creates a per-request server client and attaches it, with `safeGetSession`, to `event.locals`. `safeGetSession` verifies each access token once per request, so the gate below and the route loaders can all call it. Its memo is dropped once the response is resolved, so a caller that holds `locals` longer verifies afresh.
 * Runs before the other application handlers so every later handler can use `event.locals.supabase`.
 */
const supabaseHandle: Handle = async ({ event, resolve }) => {
  const supabase = createSupabaseServerClient(event);

  const { safeGetSession, endRequest } = createSafeGetSession(supabase);
  event.locals.supabase = supabase;
  event.locals.safeGetSession = safeGetSession;

  try {
    return await resolve(event, {
      filterSerializedResponseHeaders(name) {
        return name === 'content-range' || name === 'x-supabase-api-version';
      }
    });
  } finally {
    endRequest();
  }
};

/**
 * Logout-deadline handler.
 *
 * Signs out a request whose logout count the browser has let run out: it carries an id of the count's opening in `COOKIE.logoutPending` and no `COOKIE.logoutDeadline`, which the browser drops by its own clock at the count's end plus a grace. The count ended while no document ran it, as in a tab closed during the count. No time is compared, so a device clock that is off neither moves the deadline nor signs out a user who is present. The sign-out is local and made with the request's client, so the cookie removal it writes reaches the response and the gate below reads no session.
 *
 * Once the sign-out has worked, or has found no session, the count is settled in the same response: `COOKIE.logoutPending` is set to `LOGOUT_DEADLINE_SETTLED`, with the attributes the page writes it with. This handler never acts on a request that carries that value, so every later request keeps its session, a sign-in made after this one included. The page reads the value as "discard the Contestant App's drafts" and removes it at the tab's next navigation or in the next document. A sign-out that fails otherwise is logged by the error's name alone and writes nothing: the request goes through with its session, and the next request tries again.
 *
 * More than one id pending at once, as a copy written for the host's own domain or a parent domain makes possible, signs nothing out: every copy of both cookies is expired, host-only, for the request's host's own domain and for each of its parent domains, and a line naming the cookie is logged.
 *
 * Reads those two cookies alone, from the request's `Cookie` header, which holds every copy. Runs after `supabaseHandle`, which provides `event.locals.supabase`, and before the gate.
 */
const logoutDeadlineHandle: Handle = async ({ event, resolve }) => {
  const header = event.request.headers.get('cookie');
  const state = logoutDeadlineState(
    cookieValues(header, COOKIE.logoutPending),
    cookieValues(header, COOKIE.logoutDeadline)
  );
  if (state === 'runOut') {
    const { error } = await event.locals.supabase.auth.signOut({ scope: 'local' }).catch((e: Error) => ({ error: e }));
    if (error && error.name !== 'AuthSessionMissingError') {
      log.error(`[logout deadline] sign-out failed: ${error.name}`);
    } else {
      event.cookies.set(COOKIE.logoutPending, LOGOUT_DEADLINE_SETTLED, {
        path: '/',
        httpOnly: false,
        sameSite: 'lax',
        secure: event.url.protocol === 'https:',
        maxAge: LOGOUT_PENDING_MAX_AGE_SECONDS
      });
    }
  } else if (state === 'duplicated') {
    log.warn(`[logout deadline] more than one ${COOKIE.logoutPending} cookie; every copy is expired`);
    for (const name of [COOKIE.logoutPending, COOKIE.logoutDeadline]) {
      event.cookies.delete(name, { path: '/' });
      for (const domain of removalDomainsOf(event.url.hostname)) event.cookies.delete(name, { path: '/', domain });
    }
  }
  return resolve(event);
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
 * Redirects a signed-in caller away from a gated application's entry routes, the screens a visitor signs in or registers through, and a caller with no session away from its `(protected)` routes. The gated applications, the Contestant App and the Admin App, are the rows of `APP_GATES` in `$lib/routes`; this handler loops over that table and names no application itself.
 *
 * - The session is read only after a row has matched, so public voter pages make no session round trip.
 * - This is a session gate, not a role gate. Whether the signed-in user may act in the application is decided by that application's protected layout and form actions.
 * - Both redirect targets are built by `buildRoute` from a route key in the row, and Paraglide adds the locale prefix, as in the protected layouts' own login redirects.
 */
const appGateHandle: Handle = async ({ event, resolve }) => {
  const { url, route } = event;
  const locale = getLocale();

  // Skip non-route and API requests.
  if (route?.id == null || isApiRoute(route.id)) {
    return resolve(event);
  }
  // Bound after the guard, so it narrows to `string`.
  const routeId = route.id;

  // The gate is matched on the route id, which carries no base path, no locale prefix and no param values, so a subpath deployment or a param containing an application's name cannot misfire it. No match means a public voter route.
  const gate = resolveAppGate(routeId);
  if (!gate) return resolve(event);

  const { session } = await event.locals.safeGetSession();

  if (session && gate.entryRoutes.some((key) => ROUTE[key] === routeId)) {
    const { status, route: target, params } = gate.whenAuthenticatedOnLogin;
    redirect(status, buildRoute({ route: target, locale, ...params({ redirectTo: '' }) }));
  }
  if (!session && isProtectedRoute(routeId)) {
    const { status, route: target, params } = gate.whenUnauthenticatedInProtectedGroup;
    // The requested path, which the candidate row carries back as `redirectTo` and the admin row ignores. It is read off the URL because the route id has placeholders instead of values. `redirectTo` is not a route param, so `buildRoute` puts it in the query string, percent-encoded.
    redirect(status, buildRoute({ route: target, locale, ...params({ redirectTo: loginRedirectTargetOf(url) }) }));
  }

  return resolve(event);
};

export const handle: Handle = sequence(inFlightHandle, supabaseHandle, logoutDeadlineHandle, paraglideHandle, appGateHandle);

/**
 * The error the error page renders for an unexpected error or a page that does not exist.
 * Its `message` is the response's status, which the error page shows as its title, so a missing page is titled 404 and a server error 500. The error itself is logged on the server and never reaches the page.
 */
export const handleError: HandleServerError = async ({ error, status }) => {
  console.error('Server error:', error);
  return { message: String(status) };
};

/**
 * Start-up check of a production server.
 * Runs once, before the server answers its first request and after both dynamic environments are populated. It does nothing in development and during the build.
 * Refuses to start when a required variable is unset: it throws one error that names every such variable and prints no value.
 * A server that passes the check attaches the listeners that write one line as it exits; one that refuses attaches nothing.
 */
export const init: ServerInit = () => {
  if (dev || building) return;

  const missing = missingRequiredEnv({ ...privateEnv, ...publicEnv });
  if (missing.length > 0) throw new Error(`Required environment variables are not set: ${missing.join(', ')}`);

  registerShutdownLog(inFlight);
};
