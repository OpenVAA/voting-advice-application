import { ADMIN, isContestantRoute } from './route';
import type { Route } from './route';

/**
 * # The app-gate table
 *
 * The request hook gates two applications behind a signed-in session. Each application is one row of this table: a predicate over the route id, the list of its entry routes and two redirect descriptors. The per-application knowledge is data, and the handler is a loop with no application name in it, so the two gates cannot drift apart as two hand-written conditionals would.
 *
 * ## Three properties this module holds, each of which the hook depends on
 *
 * 1. **Membership is decided from a SvelteKit ROUTE ID, never from a pathname.** A route id carries no base path and no locale prefix, and its dynamic segments are placeholders rather than values. So serving the app from a subpath, or a voter route whose parameters happen to contain an application's name, cannot make a gate misfire. `isAdminRoute` mirrors `isContestantRoute` in the sibling `route.ts` exactly: equal to the app root, or below it after a separator. Whatever either predicate does about segment boundaries, both do.
 * 2. **The table is immutable.** `APP_GATES`, every row, every list of entry routes and every descriptor are frozen. The table is module-level state shared by every concurrent request in the SSR module graph, so a handler that could write to it would let one request change another's gate decision. There is no module-level mutable binding in this file at all.
 * 3. **A row names route KEYS — never a path.** An entry route is a key of the `ROUTE` map, and a redirect descriptor is such a key plus the parameters the route builder needs. `buildRoute` is the app's single producer of route strings, and a row holding a pre-built path would be a second one.
 *
 * ## The entry routes
 *
 * An application's entry routes are the screens a visitor signs in or registers through. A caller who already has a session is sent away from every one of them, to the application's home, with no parameter: a second sign-in or a second registration over a live session would act on the account that is signed in, which on a shared computer may be another person's. The Contestant App lists its login screen, its sign-in screen, its registration page, the two screens a registration code leads to and its "email sent" screen. Its forgot-password and password-reset pages are deliberately absent: a mailed recovery link signs the user in before the password-reset page is shown.
 *
 * ## Why the two rows are not symmetrical, and why that is carried as data
 *
 * The two applications bounce an unauthenticated caller differently:
 *
 * - The **candidate** row bounces with **303** to the candidate login page, carrying the path the visitor was trying to reach as `redirectTo`, which is validated through `safeRedirectTarget` where it is consumed.
 * - The **admin** row bounces with **307** to the admin login page, carrying the `errorMessage` value the admin protected layout redirects with, so the login page renders the same state for both. Nothing in the app produces a `redirectTo` for the admin login page, so the admin row deliberately carries none.
 *
 * The status code therefore lives in the row rather than in the handler, so the difference is declared rather than branched on.
 *
 * ## What this module deliberately does NOT decide
 *
 * **A row is a SESSION gate, not a ROLE gate.** It answers "which application does this route id belong to", and the handler pairs that with "is there a session". Whether the signed-in user may act in that application is decided by the application's own protected layout and by its form actions, and adding a role read here would add a user-data round trip to every gated request and put a second copy of a decision that already has a home.
 */

/**
 * The per-request values a redirect descriptor's parameters may be built from.
 *
 * Only the redirect target is per-request. It exists because the candidate bounce carries the path the visitor was trying to reach, which cannot be declared ahead of time; rows that need no per-request value ignore it.
 */
export type GateRedirectContext = {
  /** The in-app path the visitor was trying to reach, with the locale prefix and the leading separator removed. */
  readonly redirectTo: string;
};

/**
 * One redirect a gate row can ask the handler to issue: a status, a route key, and the parameters the route builder needs.
 *
 * The parameters are a function rather than a record so a row can carry a per-request value without the handler knowing which rows do. A row that needs none returns an empty record.
 */
export type GateRedirect = {
  /** The HTTP status. Declared per row because the two applications' bounces differ. */
  readonly status: 303 | 307;
  /** The target, as a key of the `ROUTE` map. Never a path: `buildRoute` is the only producer of route strings. */
  readonly route: Route;
  /**
   * The parameters to hand `buildRoute` alongside the route key.
   *
   * @param context - The per-request values available to the descriptor.
   * @returns The parameters, which may be empty.
   */
  readonly params: (context: GateRedirectContext) => Readonly<Record<string, string>>;
};

/**
 * One application's row in the gate table.
 */
export type AppGate = {
  /** A human name, used only in diagnostics — a failure that names the application beats one that names an index. */
  readonly name: string;
  /**
   * Whether a route id belongs to this application.
   *
   * @param routeId - A SvelteKit route id, e.g. `event.route.id`.
   * @returns `true` when the id is this application's root or sits below it.
   */
  readonly isRoute: (routeId: string) => boolean;
  /** This application's login page, as a key of the `ROUTE` map. It is one of the entry routes. */
  readonly loginRoute: Route;
  /**
   * The routes a signed-in caller is sent away from, each as a key of the `ROUTE` map: the screens a visitor signs in or registers through. The handler tests whether the request's route id is the id of one of them.
   */
  readonly entryRoutes: ReadonlyArray<Route>;
  /** Where to send a caller who already has a session and is asking for one of this application's entry routes. It carries no parameter. */
  readonly whenAuthenticatedOnLogin: GateRedirect;
  /** Where to send a caller with no session who is asking for a route inside this application's `(protected)` group. */
  readonly whenUnauthenticatedInProtectedGroup: GateRedirect;
};

/**
 * True when `routeId` names a route inside the Admin App.
 *
 * Takes a SvelteKit ROUTE ID, never a pathname, for the reason given in this module's own docstring. The mechanism is `isContestantRoute`'s, mirrored rather than reinvented: equal to the application root, or below it after a separator. The separator is what makes it segment-exact — a bare `startsWith` would also claim a sibling application whose first segment merely BEGINS with the admin segment, and that sibling's unauthenticated callers would then be bounced to the admin login page.
 *
 * It lives here rather than beside `isContestantRoute` because this module is where the gate rows are declared and the predicate exists to serve the admin row; the barrel re-exports both from one place either way.
 *
 * @param routeId - A SvelteKit route id, e.g. `event.route.id`.
 * @returns `true` when the id is the Admin App root or sits below it.
 */
export function isAdminRoute(routeId: string): boolean {
  return routeId === ADMIN || routeId.startsWith(`${ADMIN}/`);
}

/**
 * The Contestant App's gate.
 */
const CONTESTANT_GATE: AppGate = Object.freeze({
  name: 'Contestant App',
  isRoute: isContestantRoute,
  loginRoute: 'ContestantAppLogin',
  entryRoutes: Object.freeze([
    'ContestantAppLogin',
    'ContestantAppSignIn',
    'ContestantAppRegister',
    'ContestantAppRegisterEmail',
    'ContestantAppRegisterSignIn',
    'ContestantAppEmailSent'
  ] satisfies ReadonlyArray<Route>),
  whenAuthenticatedOnLogin: Object.freeze({
    status: 303,
    route: 'ContestantAppHome',
    params: () => ({})
  }),
  whenUnauthenticatedInProtectedGroup: Object.freeze({
    status: 303,
    route: 'ContestantAppLogin',
    // The value is caller-influenced only in the sense that it is the path the caller asked for; it is emitted here and validated by `safeRedirectTarget` where it is consumed.
    params: ({ redirectTo }: GateRedirectContext) => ({ redirectTo })
  })
});

/**
 * The Admin App's gate, whose redirect pair is the admin protected layout's own unauthenticated bounce.
 *
 * The layout's bounce is `redirect(307, buildRoute({ route: 'AdminAppLogin', locale, errorMessage: 'loginFailed' }))`. This row is that pair, so an unauthenticated admin request stops at the hook and lands on the login page state the layout's bounce leads to.
 */
const ADMIN_GATE: AppGate = Object.freeze({
  name: 'Admin App',
  isRoute: isAdminRoute,
  loginRoute: 'AdminAppLogin',
  entryRoutes: Object.freeze(['AdminAppLogin'] satisfies ReadonlyArray<Route>),
  whenAuthenticatedOnLogin: Object.freeze({
    status: 303,
    route: 'AdminAppHome',
    params: () => ({})
  }),
  whenUnauthenticatedInProtectedGroup: Object.freeze({
    status: 307,
    route: 'AdminAppLogin',
    params: () => ({ errorMessage: 'loginFailed' })
  })
});

/**
 * Every gated application, in the order the handler evaluates them: the first row whose predicate claims a route id wins.
 *
 * The Voter App is deliberately absent. It is public — it has no `(protected)` route group and nothing in it requires a session — so it has no row, and `resolveAppGate` returning `undefined` for a voter route is what keeps the handler from fetching a session on a public page load. `routeConsistency.test.ts` states that exclusion against the route tree on disk, so a voter surface that grew a protected group would fail the unit suite rather than ship ungated.
 */
export const APP_GATES: ReadonlyArray<AppGate> = Object.freeze([CONTESTANT_GATE, ADMIN_GATE]);

/**
 * The gate row that claims `routeId`, or `undefined` when no application does.
 *
 * Evaluates the table in its declared order and returns the FIRST match. The predicates partition the route map today — `appGates.test.ts` asserts that they do not overlap — so the order is not currently load-bearing for correctness; it is fixed and asserted anyway, because a future row that did overlap would otherwise change behaviour silently.
 *
 * Performs no I/O and holds no state between calls, so two concurrent requests cannot observe each other here.
 *
 * @param routeId - A SvelteKit route id, e.g. `event.route.id`.
 * @returns The matching row, or `undefined` for a route belonging to no gated application.
 */
export function resolveAppGate(routeId: string): AppGate | undefined {
  return APP_GATES.find((gate) => gate.isRoute(routeId));
}
