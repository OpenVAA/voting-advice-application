import { ADMIN, isCandidateRoute } from './route';
import type { Route } from './route';

/**
 * # The app-gate table
 *
 * The request hook gates two applications behind a signed-in session. Written as two conditionals in the handler, the two gates are two hand-maintained copies of one decision: they drift, and nothing notices, because a gate that has quietly stopped gating still returns 200. Written as rows of one table, the per-application knowledge is DATA — a predicate over the route id and two redirect descriptors — and the handler is a loop with no application name in it.
 *
 * ## Three properties this module holds, each of which the hook depends on
 *
 * 1. **Membership is decided from a SvelteKit ROUTE ID, never from a pathname.** A route id carries no base path and no locale prefix, and its dynamic segments are placeholders rather than values. So serving the app from a subpath, or a voter route whose parameters happen to contain an application's name, cannot make a gate misfire. `isAdminRoute` mirrors `isCandidateRoute` in the sibling `route.ts` exactly: equal to the app root, or below it after a separator. Whatever either predicate does about segment boundaries, both do.
 * 2. **The table is immutable.** `APP_GATES`, every row and every descriptor are frozen. The table is module-level state shared by every concurrent request in the SSR module graph, so a handler that could write to it would let one request change another's gate decision. There is no module-level mutable binding in this file at all.
 * 3. **A redirect descriptor names a route KEY plus the parameters the route builder needs — never a path.** `buildRoute` is the app's single producer of route strings, and a descriptor holding a pre-built path would be a second one.
 *
 * ## Why the two rows are not symmetrical, and why that is carried as data
 *
 * The two applications genuinely bounce an unauthenticated caller differently, and both shapes predate this table:
 *
 * - The **candidate** row bounces with **303** to the candidate login page, carrying the path the visitor was trying to reach as `redirectTo`, which the login page posts back and the login action validates through `safeRedirectTarget`.
 * - The **admin** row bounces with **307** to the admin login page, carrying the `errorMessage` value the admin protected layout already redirects with, so the login page renders the same state it renders today. Nothing in the app produces a `redirectTo` for the admin login page, so the admin row deliberately carries none.
 *
 * Preserving both shapes is the conservative choice: either could have been normalised to the other, and normalising would silently change what one of the two login pages renders, which no requirement asked for. The status code therefore lives in the row rather than in the handler, so the difference is declared rather than branched on.
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
  /** The HTTP status. Declared per row because the two applications' existing bounces differ and normalising them would change behaviour. */
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
  /** This application's login page, as a key of the `ROUTE` map. The handler compares the request's route id against it. */
  readonly loginRoute: Route;
  /** Where to send a caller who already has a session and is asking for this application's login page. */
  readonly whenAuthenticatedOnLogin: GateRedirect;
  /** Where to send a caller with no session who is asking for a route inside this application's `(protected)` group. */
  readonly whenUnauthenticatedInProtectedGroup: GateRedirect;
};

/**
 * True when `routeId` names a route inside the Admin App.
 *
 * Takes a SvelteKit ROUTE ID, never a pathname, for the reason given in this module's own docstring. The mechanism is `isCandidateRoute`'s, mirrored rather than reinvented: equal to the application root, or below it after a separator. The separator is what makes it segment-exact — a bare `startsWith` would also claim a sibling application whose first segment merely BEGINS with the admin segment, and that sibling's unauthenticated callers would then be bounced to the admin login page.
 *
 * It lives here rather than beside `isCandidateRoute` because this module is where the gate rows are declared and the predicate exists to serve the admin row; the barrel re-exports both from one place either way.
 *
 * @param routeId - A SvelteKit route id, e.g. `event.route.id`.
 * @returns `true` when the id is the Admin App root or sits below it.
 */
export function isAdminRoute(routeId: string): boolean {
  return routeId === ADMIN || routeId.startsWith(`${ADMIN}/`);
}

/**
 * The Candidate App's gate, transcribed from what the request hook did before this table existed.
 */
const CANDIDATE_GATE: AppGate = Object.freeze({
  name: 'Candidate App',
  isRoute: isCandidateRoute,
  loginRoute: 'CandAppLogin',
  whenAuthenticatedOnLogin: Object.freeze({
    status: 303,
    route: 'CandAppHome',
    params: () => ({})
  }),
  whenUnauthenticatedInProtectedGroup: Object.freeze({
    status: 303,
    route: 'CandAppLogin',
    // The value is caller-influenced only in the sense that it is the path the caller asked for; it is emitted here and validated by `safeRedirectTarget` in the login action that consumes it, which is the single validation site named in `loginRedirectTarget.ts`.
    params: ({ redirectTo }: GateRedirectContext) => ({ redirectTo })
  })
});

/**
 * The Admin App's gate, whose redirect pair reproduces the admin protected layout's own unauthenticated bounce.
 *
 * The layout's bounce is `redirect(307, buildRoute({ route: 'AdminAppLogin', locale, errorMessage: 'loginFailed' }))`. This row is that pair, so an unauthenticated admin request now stops one layer earlier and lands on exactly the login page state it landed on before.
 */
const ADMIN_GATE: AppGate = Object.freeze({
  name: 'Admin App',
  isRoute: isAdminRoute,
  loginRoute: 'AdminAppLogin',
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
export const APP_GATES: ReadonlyArray<AppGate> = Object.freeze([CANDIDATE_GATE, ADMIN_GATE]);

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
