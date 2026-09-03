/* eslint-disable func-style -- SvelteKit hooks use typed const exports by convention */
import { configureLogger, log } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { API_ROOT } from '$lib/api/base/universalApiRoutes';
import { getLocale } from '$lib/paraglide/runtime';
import { paraglideMiddleware } from '$lib/paraglide/server';
import { buildRoute, isProtectedRoute, resolveAppGate, ROUTE } from '$lib/routes';
import { createSupabaseServerClient } from '$lib/supabase/server';
import { constants } from '$lib/utils/constants';
import { resolveLogLevel } from '$lib/utils/logLevel';
import type { Handle, HandleServerError } from '@sveltejs/kit';

// Configure the shared logger for the SSR module graph, at module scope so it runs once at server start, before any handler in the `sequence` below and therefore before `supabaseHandle`.
// The logger's enablement is module-scope state and SvelteKit runs the client and the server as separate module graphs, so this call configures only the SSR half; `hooks.client.ts` makes the matching call for the browser.
// THE ORDER OF THE THREE STATEMENTS BELOW IS LOAD-BEARING (decision C3's NOTE, pitfall P3): resolve, then configure, and only then emit. `emit` early-returns while the threshold is still `'silent'` (`packages/app-shared/src/logging/logger.ts:67`), so a record emitted before `configureLogger` would be dropped and the message about silence would itself be silent. The three statements are byte-identical in the other entry point because decision C2 requires the browser and the server to run at the same level.
const { level: logLevel, problem: logLevelProblem } = resolveLogLevel(
  constants.PUBLIC_LOG_LEVEL,
  import.meta.env.DEV,
  constants.PUBLIC_DEBUG
);
configureLogger({ level: logLevel });
if (logLevelProblem) {
  // ⚠ THE SEVERITY IS SPLIT BY REASON, and the split is what keeps the new `error` channel worth reading. An absent optional variable with a documented default is an `info`-level FACT; a value that was set and is out of vocabulary is an `error`. Reporting both at `error` meant every existing deployment and every developer with a pre-existing `.env` emitted an error-severity record naming a default that is working as designed — once per process start on the server, but once per FULL PAGE LOAD PER VISITOR in the browser entry point, since that file runs in the browser module graph. A constant, non-actionable record at the top of a production error stream is the noise floor that trains people to ignore the channel, which is the opposite of what ruling D9 raised the level for.
  const emit = logLevelProblem.reason === 'invalid' ? log.error : log.info;
  emit('PUBLIC_LOG_LEVEL is unusable; the logger fell back to a default level.', {
    ...logLevelProblem,
    level: logLevel
  });
}

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
 * Application session-gate handler (Supabase session).
 *
 * Redirects a signed-in caller away from a gated application's login page, and a caller with no session away from a gated application's `(protected)` routes. Both applications the app gates — the Candidate App and the Admin App — are rows of ONE table, `APP_GATES` in `$lib/routes`, and this handler is a loop over it with no application named in a conditional. Two hand-written auth arms in the same function would be two copies of one decision, and a copy that has quietly stopped gating still answers 200.
 *
 * Four properties of this handler, each of which is a way it can go wrong without any test noticing:
 *
 * 1. **The API-root early return is a `startsWith` on the pathname, deliberately.** It guards a served URL prefix rather than a route id, which is what makes an anchored prefix test the correct instrument there. It is the only pathname MEMBERSHIP test in the function; the gate decision below reads route ids only.
 * 2. **The session is fetched once, and only after a row has matched.** Fetching it before the lookup would add a session round trip to every public voter page load — a regression no test would catch, because everything would still be correct, only slower.
 * 3. **This is a SESSION gate, not a ROLE gate.** It decides authenticated-versus-not. Whether the signed-in user may act in the application is decided by that application's protected layout and by its form actions; a role read here would add a user-data round trip to every gated request and put a second copy of a decision that already has a home.
 * 4. **Both redirect targets are built by `buildRoute` from a route KEY carried in the row**, never interpolated, so a route that moves stays reachable from here without a second edit. The locale prefix is Paraglide's to add, which means the base locale gets the unprefixed canonical URL instead of a redundant prefix; both protected layouts build their login redirects the same way, so the hook and the layouts agree.
 */
const appGateHandle: Handle = async ({ event, resolve }) => {
  const { url, route } = event;
  const locale = getLocale();
  const pathname = url.pathname;

  // Skip non-route and API requests. The API test stays a `startsWith` on the pathname on purpose: it guards a served URL prefix rather than a route id, so it is correct as written and is not an instance of the defect fixed below.
  if (route?.id == null || pathname.startsWith(NORMALIZED_API_ROOT)) {
    return resolve(event);
  }
  // Bind once, immediately after the guard, so the compiler sees a `string` here and no non-null assertion is needed below.
  const routeId = route.id;

  // Which application this request belongs to is decided by the gate table, from the ROUTE ID. A route id carries no base path and no locale prefix and its dynamic segments are placeholders rather than values, so serving the app from a subpath, or a voter route whose params contain an application's name, cannot make a gate misfire. No row matching means the route belongs to no gated application — the public voter surface — and the handler stops here, before any session round trip.
  const gate = resolveAppGate(routeId);
  if (!gate) return resolve(event);

  const { session } = await event.locals.safeGetSession();

  if (session && routeId === ROUTE[gate.loginRoute]) {
    const { status, route: target, params } = gate.whenAuthenticatedOnLogin;
    redirect(status, buildRoute({ route: target, locale, ...params({ redirectTo: '' }) }));
  }
  if (!session && isProtectedRoute(routeId)) {
    const { status, route: target, params } = gate.whenUnauthenticatedInProtectedGroup;
    // The path the visitor asked for, which the candidate row carries back as `redirectTo` and the admin row ignores. It is read off the pathname because a route id has placeholders where this needs values; it is a value being carried, not a membership test. `redirectTo` is not a declared route param, so `buildRoute` emits it on the search side percent-encoded, and the login page decodes it off `url.searchParams` before `safeRedirectTarget` sees it.
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
