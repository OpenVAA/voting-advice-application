import { describe, expect, it } from 'vitest';
import { APP_GATES, isAdminRoute, resolveAppGate } from './appGates';
import { isContestantRoute, isProtectedRoute, ROUTE } from './route';
import type { AppGate } from './appGates';

/**
 * # The app-gate table (D10 criterion 9, REVIEW-RT-04)
 *
 * The request hook gates two applications. Before this spec's subject existed it gated one, with the second app's arm simply absent; the obvious way to add the second is a second conditional, and two hand-written auth arms in one function are the duplication this phase exists to remove. So the two gates are rows of ONE declared table and the hook loops over it.
 *
 * What this file has to establish, each item a distinct way the table could be wrong while the suite stayed green:
 *
 * 1. **The admin predicate matches by segment, not by substring.** A route id whose first segment merely BEGINS with the admin segment must not borrow the admin app's gate. This is the escalation shape, and it has an explicit case rather than being implied by the mechanism.
 * 2. **The table is ordered and the first match wins.** Asserted by fixing the order and comparing the RESOLVED ROW'S IDENTITY against the row at the expected index — not by asserting that only one row can ever match, which would be a weaker claim that happens to be true today.
 * 3. **The table is frozen.** A request handler that could rewrite its own gate mid-request is a worse shape than the two conditionals this replaces. The freeze is asserted, including that a write throws, rather than assumed from the `Object.freeze` call being visible in the source.
 * 4. **The two rows' redirect descriptors differ, deliberately.** The candidate row bounces an unauthenticated caller with 303 and a redirect target; the admin row bounces with 307 and the error-message value its protected layout already uses. Those are the shapes that exist today on each side, and the table carries the difference as data so the hook does not have to branch on it.
 * 5. **A descriptor names a route KEY, never a path.** Route strings have one producer in this app; a descriptor holding a pre-built path would be a second one.
 *
 * The cross-file half of item 4 — that the admin row's error-message value is the SAME value the admin protected layout redirects with — is asserted in `routeConsistency.test.ts`, which is the file that already reads the tree from disk.
 */

/** A route id shaped like an admin route's neighbour: its first segment begins with the admin segment but is not it. This is the substring-match escalation case, spelled out rather than generated. */
const ADMIN_SIBLING_PREFIX_ROUTE_IDS = ['/admin-tools', '/admin-tools/jobs', '/administration', '/adminx'];

/** The same shape on the candidate side, so the two predicates are held to one standard. */
const CONTESTANT_SIBLING_PREFIX_ROUTE_IDS = ['/contestant-portal', '/contestants'];

/**
 * The descriptor parameters, resolved with a representative redirect target.
 *
 * A descriptor's parameters are a function of the request, because the candidate bounce carries the path the visitor was trying to reach and that value cannot be declared ahead of time. Calling it here is what turns "the row declares a parameter" into an assertion about a value.
 *
 * @param gate - The row whose unauthenticated-in-protected descriptor is being read.
 * @param redirectTo - The redirect target the hook would supply for this request.
 * @returns The parameters the route builder would be handed.
 */
function protectedBounceParams(gate: AppGate, redirectTo: string): Record<string, string> {
  return { ...gate.whenUnauthenticatedInProtectedGroup.params({ redirectTo }) };
}

describe('isAdminRoute — segment-exact membership of the Admin App (D10-C09)', () => {
  it.each([
    ['the admin app root', ROUTE.AdminAppHome],
    ['the admin login page', ROUTE.AdminAppLogin],
    ['a protected admin page', ROUTE.AdminAppJobs],
    ['a protected admin page with a dynamic segment', ROUTE.AdminAppJob]
  ])('answers true for %s', (_what, routeId) => {
    expect(
      isAdminRoute(routeId),
      `isAdminRoute answered false for ${routeId}, which is the Admin App root or sits below it. The request hook selects the admin gate row with this predicate, so a route it calls public is a route the hook does not gate at all.`
    ).toBe(true);
  });

  it.each(ADMIN_SIBLING_PREFIX_ROUTE_IDS)('answers false for the sibling-prefix route id %s', (routeId) => {
    expect(
      isAdminRoute(routeId),
      `isAdminRoute answered true for ${routeId}, whose first segment begins with the admin segment but is not it. That is a substring match rather than a segment match: a sibling application mounted next to the admin app would borrow the admin app's gate, and its unauthenticated callers would be bounced to the admin login page.`
    ).toBe(false);
  });

  it.each([
    ['the voter app root', ROUTE.Home],
    ['a voter results page', ROUTE.Results],
    ['the contestant app root', ROUTE.ContestantAppHome],
    ['a protected candidate page', ROUTE.ContestantAppProfile]
  ])('answers false for %s', (_what, routeId) => {
    expect(
      isAdminRoute(routeId),
      `isAdminRoute answered true for ${routeId}, which belongs to another application. Two rows of the gate table would then match one route id and the second application's gate would never be reached.`
    ).toBe(false);
  });

  it('is disjoint from isContestantRoute over every route id in the map', () => {
    const bothApps = Object.entries(ROUTE)
      .filter(([, routeId]) => isAdminRoute(routeId) && isContestantRoute(routeId))
      .map(([key, routeId]) => `${key} (${routeId})`);
    expect(
      bothApps,
      `Some ROUTE entries are claimed by both application predicates, so the gate table's declared order silently decides which application gates them. The two predicates must partition the map, not overlap it. Offending entries: ${bothApps.join(', ')}`
    ).toEqual([]);
  });
});

describe('APP_GATES — one declared table, two rows (D10-C09)', () => {
  it('has exactly two rows', () => {
    expect(
      APP_GATES.length,
      'The gate table is expected to carry exactly two rows, one per gated application. A third row added without its own cases in this file would ship a gate nothing here measures; add the cases with the row.'
    ).toBe(2);
  });

  it('names each row for diagnostics, with no two rows sharing a name', () => {
    const names = APP_GATES.map((gate) => gate.name);
    expect(names.filter((name) => name.trim() === '')).toEqual([]);
    expect(
      new Set(names).size,
      `Two rows of the gate table share a name, so a failure naming the row would be ambiguous. Names: ${names.join(', ')}`
    ).toBe(names.length);
  });

  it('declares the candidate row first and the admin row second', () => {
    expect(
      APP_GATES.map((gate) => gate.loginRoute),
      'The order of the gate table is load-bearing, because resolveAppGate returns the FIRST matching row. This assertion fixes the order the identity assertions below are written against.'
    ).toEqual(['ContestantAppLogin', 'AdminAppLogin']);
  });

  it('is frozen, and a write to it throws', () => {
    expect(Object.isFrozen(APP_GATES), 'The gate table is not frozen.').toBe(true);
    expect(() => {
      (APP_GATES as Array<AppGate>)[0] = APP_GATES[1];
    }, 'Overwriting a row of the gate table did not throw. A request handler that can rewrite its own gate table is a worse shape than the two hand-written conditionals this table replaces.').toThrow();
    expect(
      APP_GATES[0].loginRoute,
      'The gate table changed after a write was attempted against it, so the freeze is nominal.'
    ).toBe('ContestantAppLogin');
  });

  it('freezes every row and every redirect descriptor', () => {
    for (const gate of APP_GATES) {
      expect(Object.isFrozen(gate), `The gate row ${gate.name} is not frozen.`).toBe(true);
      expect(
        Object.isFrozen(gate.whenAuthenticatedOnLogin),
        `The authenticated-on-login descriptor of ${gate.name} is not frozen.`
      ).toBe(true);
      expect(
        Object.isFrozen(gate.whenUnauthenticatedInProtectedGroup),
        `The unauthenticated-in-protected descriptor of ${gate.name} is not frozen.`
      ).toBe(true);
      expect(Object.isFrozen(gate.entryRoutes), `The list of entry routes of ${gate.name} is not frozen.`).toBe(true);
    }
  });

  it('holds no path string in any descriptor: every target is a route key', () => {
    for (const gate of APP_GATES) {
      for (const descriptor of [gate.whenAuthenticatedOnLogin, gate.whenUnauthenticatedInProtectedGroup]) {
        expect(
          descriptor.route in ROUTE,
          `The descriptor ${descriptor.route} on the row ${gate.name} is not a key of the ROUTE map. A descriptor naming a path rather than a key gives the app a second producer of route strings, which is the drift this table exists to remove.`
        ).toBe(true);
      }
      expect(gate.loginRoute in ROUTE, `The login route key of ${gate.name} is not a key of the ROUTE map.`).toBe(true);
      for (const key of gate.entryRoutes) {
        expect(
          key in ROUTE,
          `The entry route ${key} on the row ${gate.name} is not a key of the ROUTE map. The list names route keys, and the handler resolves each to its route id.`
        ).toBe(true);
      }
    }
  });
});

describe('resolveAppGate — the first matching row wins (D10-C09)', () => {
  it.each([
    ['the contestant app root', ROUTE.ContestantAppHome, 0],
    ['the candidate login page', ROUTE.ContestantAppLogin, 0],
    ['a protected candidate page', ROUTE.ContestantAppProfile, 0],
    ['the admin app root', ROUTE.AdminAppHome, 1],
    ['the admin login page', ROUTE.AdminAppLogin, 1],
    ['a protected admin page', ROUTE.AdminAppJobs, 1]
  ])('resolves %s to the row declared at index %i', (_what, routeId, index) => {
    expect(
      resolveAppGate(routeId),
      `resolveAppGate returned a different row than the one declared at index ${index} for ${routeId}. The table is evaluated in its declared order and the first match wins, so this asserts the identity of the row that won rather than merely that some row did.`
    ).toBe(APP_GATES[index as number]);
  });

  const UNGATED_CASES: Array<[string, string]> = [
    ['the voter app root', ROUTE.Home],
    ['a voter results page', ROUTE.Results],
    ['a voter question page', ROUTE.Question],
    ['an api route id', ROUTE.AuthLogout],
    ...ADMIN_SIBLING_PREFIX_ROUTE_IDS.map((routeId): [string, string] => [`the admin sibling ${routeId}`, routeId]),
    ...CONTESTANT_SIBLING_PREFIX_ROUTE_IDS.map((routeId): [string, string] => [
      `the candidate sibling ${routeId}`,
      routeId
    ])
  ];

  it.each(UNGATED_CASES)('returns undefined for %s', (_what, routeId) => {
    expect(
      resolveAppGate(routeId),
      `resolveAppGate matched a row for ${routeId}, which belongs to no gated application. The hook returns early when no row matches, so a spurious match makes it fetch a session and apply another application's redirects to a public page.`
    ).toBeUndefined();
  });

  it('returns independent results for two different route ids and mutates nothing', () => {
    const before = APP_GATES.map((gate) => gate.name);
    const candidate = resolveAppGate(ROUTE.ContestantAppProfile);
    const admin = resolveAppGate(ROUTE.AdminAppJobs);
    expect(candidate, 'The two lookups returned the same row for two different applications.').not.toBe(admin);
    expect(candidate?.loginRoute).toBe('ContestantAppLogin');
    expect(admin?.loginRoute).toBe('AdminAppLogin');
    expect(
      APP_GATES.map((gate) => gate.name),
      'Resolving a gate changed the table. The table is module-level state shared by every concurrent request, so a lookup that mutated it would let two requests observe each other.'
    ).toEqual(before);
  });
});

describe('the two rows carry their genuinely different redirect shapes as data (D10-C09)', () => {
  it('bounces an unauthenticated candidate with 303 to the candidate login page, carrying the redirect target', () => {
    const [candidate] = APP_GATES;
    expect(candidate.whenUnauthenticatedInProtectedGroup.status).toBe(303);
    expect(candidate.whenUnauthenticatedInProtectedGroup.route).toBe('ContestantAppLogin');
    expect(
      protectedBounceParams(candidate, 'contestant/profile'),
      'The candidate row must carry the path the visitor was trying to reach, so the login page can return them to it. This is the query parameter the hook emits today and it must survive the move into the table unchanged.'
    ).toEqual({ redirectTo: 'contestant/profile' });
  });

  it('bounces an unauthenticated admin with 307 to the admin login page, carrying the error message', () => {
    const admin = APP_GATES[1];
    expect(
      admin.whenUnauthenticatedInProtectedGroup.status,
      'The admin protected layout redirects an unauthenticated caller with 307, and the hook now bounces them first. A different status here would change what the admin app answers to an unauthenticated request.'
    ).toBe(307);
    expect(admin.whenUnauthenticatedInProtectedGroup.route).toBe('AdminAppLogin');
    expect(
      protectedBounceParams(admin, 'admin/jobs'),
      'The admin row must reproduce the error-message value the admin protected layout already redirects with, and must NOT carry a redirect target: nothing in the app produces one for the admin login page, and adding one would change what that page renders.'
    ).toEqual({ errorMessage: 'loginFailed' });
  });

  it('sends an authenticated caller away from each app login page to that app home', () => {
    const [candidate, admin] = APP_GATES;
    expect(candidate.whenAuthenticatedOnLogin.status).toBe(303);
    expect(candidate.whenAuthenticatedOnLogin.route).toBe('ContestantAppHome');
    expect(candidate.whenAuthenticatedOnLogin.params({ redirectTo: 'contestant/profile' })).toEqual({});
    expect(admin.whenAuthenticatedOnLogin.status).toBe(303);
    expect(admin.whenAuthenticatedOnLogin.route).toBe('AdminAppHome');
    expect(
      admin.whenAuthenticatedOnLogin.params({ redirectTo: 'admin/jobs' }),
      'The authenticated-on-login bounce carries no parameters on either side; a redirect target here would be a caller-controlled value applied to an already-authenticated session.'
    ).toEqual({});
  });

  it('resolves each descriptor to a route id that its own application predicate claims', () => {
    for (const gate of APP_GATES) {
      for (const descriptor of [gate.whenAuthenticatedOnLogin, gate.whenUnauthenticatedInProtectedGroup]) {
        const target = ROUTE[descriptor.route];
        expect(
          gate.isRoute(target),
          `The row ${gate.name} redirects to ${descriptor.route} (${target}), which its own predicate does not claim. A gate that redirects out of its own application either loops or hands the request to another application's gate.`
        ).toBe(true);
      }
    }
  });
});

describe('the entry routes — every route a signed-in caller is sent away from', () => {
  it('lists exactly the seven screens of the entry flow for the Contestant App', () => {
    const [candidate] = APP_GATES;
    expect(
      [...candidate.entryRoutes].sort(),
      'The Contestant App row must name the login screen, the sign-in screen, the registration page, the two screens a registration code leads to, the "email sent" screen and the identity provider\'s error screen, and nothing else. A screen of the entry flow left out is one a signed-in user can open, and start a second sign-in or registration over a live session from.'
    ).toEqual(
      [
        'ContestantAppEmailSent',
        'ContestantAppIdentityProviderError',
        'ContestantAppLogin',
        'ContestantAppRegister',
        'ContestantAppRegisterEmail',
        'ContestantAppRegisterSignIn',
        'ContestantAppSignIn'
      ].sort()
    );
  });

  it('lists the one login page for the Admin App', () => {
    expect([...APP_GATES[1].entryRoutes]).toEqual(['AdminAppLogin']);
  });

  it('holds the login route of its own row, and no key twice', () => {
    for (const gate of APP_GATES) {
      expect(gate.entryRoutes, `The entry routes of ${gate.name} do not hold its own login route.`).toContain(
        gate.loginRoute
      );
      expect(new Set(gate.entryRoutes).size, `An entry route of ${gate.name} is listed twice.`).toBe(
        gate.entryRoutes.length
      );
    }
  });

  it('holds neither the forgot-password page nor the password-reset page', () => {
    const [candidate] = APP_GATES;
    expect(
      candidate.entryRoutes,
      'A signed-in user reaches the password-reset page by design: the mailed recovery link signs them in first. Listing it, or the page that asks for that link, would send them away from the page the link is for.'
    ).not.toContain('ContestantAppForgotPassword');
    expect(candidate.entryRoutes).not.toContain('ContestantAppResetPassword');
  });

  it('is frozen, and a write to it throws', () => {
    for (const gate of APP_GATES) {
      expect(Object.isFrozen(gate.entryRoutes), `The list of entry routes of ${gate.name} is not frozen.`).toBe(true);
      expect(() => {
        (gate.entryRoutes as Array<string>).push('ContestantAppResetPassword');
      }, `Adding to the entry routes of ${gate.name} did not throw. The table is shared by every concurrent request.`).toThrow();
    }
  });

  it('holds route keys alone: no entry is a path, and each resolves to a route id its own application claims', () => {
    for (const gate of APP_GATES) {
      for (const key of gate.entryRoutes) {
        expect(key, `The entry route ${key} of ${gate.name} is a path, not a route key.`).not.toContain('/');
        expect(
          gate.isRoute(ROUTE[key]),
          `The entry route ${key} of ${gate.name} resolves to ${ROUTE[key]}, which its own predicate does not claim, so the handler would never test it.`
        ).toBe(true);
      }
    }
  });

  it('names no route of a protected group', () => {
    for (const gate of APP_GATES) {
      const inProtectedGroup = gate.entryRoutes.filter((key) => isProtectedRoute(ROUTE[key]));
      expect(
        inProtectedGroup,
        `Entry routes of ${gate.name} sit inside a protected group, which a signed-in caller must reach: ${inProtectedGroup.join(', ')}`
      ).toEqual([]);
    }
  });
});
