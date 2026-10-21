/**
 * The user-level load of the Contestant App's protected tree depends on the two entity params and on nothing else of the URL, the route or the params.
 *
 * SvelteKit reruns a load whenever a `url` property, `route.id` or a param it read TRACKED changes. This load decides who the user is and what they may edit. It reads `entityType` and `entityId` so that it reruns when the selected entity changes, and the list every decision below it is made on is then read in the same request chain. Any other tracked read would rerun it, and with it the user and entity-list reads and the entity-level load that awaits it, on every navigation between the pages of one entity. It takes `fetch`, `locals` and `params` from the request event and nothing else.
 *
 * The load is driven DIRECTLY with a fake event that is itself a recording Proxy, and whose members are instruments:
 * - `url` records every property read that happens outside the event's own `untrack`;
 * - `route` throws on any read;
 * - `params` records every param name read;
 * - `parent` rejects.
 *
 * Correctness invariants, each one a distinct way this file could hand back a false pass:
 * 1. Each instrument must actually record. A trap that never pushed would make every assertion below `[] === []`. The control cases at the foot of this file are the answer, one per instrument.
 * 2. The `untrack` counter must actually suppress, or a load reading the URL untracked for a redirect target would be reported. The `url` control asserts that the read it makes INSIDE `untrack` is absent from the recorded set.
 * 3. The subject must be the REAL load, run to its end: the positive cases import `load` from `./+layout.server` and assert the ungated result. The controls deliberately do not import it.
 */

import { describe, expect, it, vi } from 'vitest';
import { load } from './+layout.server';
import { forbiddenRoute, recordingParams, recordingUrl } from './loadTracking.testUtils';
import type { Untrack } from './loadTracking.testUtils';

const { createDataProvider, createDataWriter } = vi.hoisted(() => ({
  createDataProvider: vi.fn(),
  createDataWriter: vi.fn()
}));

// Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
vi.mock('$lib/api/dataWriter', () => ({ createDataWriter }));
vi.mock('$lib/api/dataProvider', () => ({ createDataProvider }));

/**
 * A request event for a signed-in, ungated user who is listed with one served entity, with every instrument in place.
 * @param href - The URL of the request.
 * @param routeParams - The route params the URL carries.
 * @returns The event and what its instruments recorded.
 */
function recordingEvent(href: string, routeParams: Record<string, string>) {
  const { url, trackedReads, untrack } = recordingUrl(href);
  const { params, paramReads } = recordingParams(routeParams);
  const eventReads: Array<string> = [];
  const event = new Proxy(
    {
      fetch: vi.fn(),
      locals: {
        safeGetSession: async () => ({ session: { expires_at: 1893456000 }, user: { id: 'user-1' } }),
        supabase: { auth: { signOut: vi.fn() } }
      },
      params,
      parent: () => Promise.reject(new Error('the user-level load must not await a parent')),
      route: forbiddenRoute(),
      untrack,
      url
    },
    {
      get(target, prop) {
        if (typeof prop === 'string') eventReads.push(prop);
        return Reflect.get(target, prop, target);
      }
    }
  );
  return { event: event as unknown as Parameters<typeof load>[0], eventReads, paramReads, trackedReads };
}

const USER = {
  id: 'user-1',
  email: 'user@example.test',
  username: 'user@example.test',
  role: 'contestant',
  settings: {},
  termsOfUseAccepted: '2026-10-06T00:54:12.277826+00:00',
  passwordSet: true
};
const CANDIDATE_ID = '11111111-1111-4111-8111-111111111111';
const CANDIDATE = { type: 'candidate', id: CANDIDATE_ID, firstName: 'A', lastName: 'B', confirmed: true };

/** The params of a URL that names the candidate. */
const ENTITY_PARAMS = { entityType: 'candidate', entityId: CANDIDATE_ID };
/** The path of the candidate's home. */
const ENTITY_HOME = `/contestant/candidate/${CANDIDATE_ID}`;

describe('contestant/(protected)/+layout.server.ts load dependency tracking', () => {
  it.each([
    // The app root, which carries no param.
    ['/contestant', {}],
    ['/contestant?redirectTo=contestant%2Fprofile', {}],
    // A path that names no entity.
    ['/contestant/profile', { page: 'profile' }],
    ['/contestant/questions/q-1?start=true', { page: 'questions/q-1' }],
    // The entity home.
    [ENTITY_HOME, ENTITY_PARAMS],
    [`${ENTITY_HOME}?start=true`, ENTITY_PARAMS],
    // The profile page.
    [`${ENTITY_HOME}/profile`, ENTITY_PARAMS],
    [`${ENTITY_HOME}/profile?start=true`, ENTITY_PARAMS],
    // The questions overview.
    [`${ENTITY_HOME}/questions`, ENTITY_PARAMS],
    [`${ENTITY_HOME}/questions?start=true`, ENTITY_PARAMS],
    // A question page.
    [`${ENTITY_HOME}/questions/q-1`, { ...ENTITY_PARAMS, questionId: 'q-1' }],
    [`${ENTITY_HOME}/questions/q-1?start=true`, { ...ENTITY_PARAMS, questionId: 'q-1' }]
  ] as Array<[string, Record<string, string>]>)(
    'reads the two entity params and no other, no URL property tracked and no route (%s)',
    async (path, routeParams) => {
      createDataWriter.mockReturnValue({
        getBasicUserData: async () => USER,
        getUserEntities: async () => [CANDIDATE]
      });
      createDataProvider.mockReturnValue({
        getAppSettings: async () => ({ contestantApp: { entityTypes: ['candidate'] } })
      });
      const { event, eventReads, paramReads, trackedReads } = recordingEvent(`http://localhost${path}`, routeParams);

      const result = await load(event);

      expect(trackedReads, 'a tracked url read makes SvelteKit rerun this load on every navigation').toEqual([]);
      expect(
        [...new Set(paramReads)].sort(),
        'the load reruns when the selected entity changes, and a read of any other param would rerun it on a navigation inside one entity'
      ).toEqual(['entityId', 'entityType']);
      expect(
        [...new Set(eventReads)].sort(),
        'the load takes fetch, locals and params from the event and nothing else'
      ).toEqual(['fetch', 'locals', 'params']);
      // The load ran to its end, so every stage had the chance to read.
      expect(result).toEqual({ gate: null, user: USER, entities: [CANDIDATE] });
    }
  );

  /**
   * Negative controls: the assertions above are only meaningful if each instrument can catch what it guards against.
   *
   * Each subject is a LOCAL load-shaped function. None imports the real `load`: that would make the control a test of production code rather than of the instrument.
   *
   * NAMED LIMIT: these prove the INSTRUMENTS work. They do not prove the real load was ever wrong.
   */
  it('the recording url Proxy catches a tracked url.pathname read (negative control)', () => {
    /** A redirect target built from a tracked path, kept local to this control. */
    function trackedRedirectTarget({ url, untrack }: { url: URL; untrack: Untrack }): string {
      // An untracked read, exercised so the counter's suppression is covered as well as its recording.
      untrack(() => url.searchParams.get('redirectTo'));
      // Tracked.
      return `redirectTo=${encodeURIComponent(url.pathname)}`;
    }

    const { url, trackedReads, untrack } = recordingUrl('http://localhost/contestant/profile?redirectTo=x');
    trackedRedirectTarget({ url, untrack });

    expect(
      trackedReads,
      'the Proxy failed to record a tracked url.pathname read, so the assertions above prove nothing'
    ).toEqual(['pathname']);
    expect(
      trackedReads,
      'the untrack counter failed to suppress a read inside it, so a legitimate untracked read would be reported'
    ).not.toEqual(expect.arrayContaining(['searchParams']));
  });

  it('the recording params Proxy records a param read (negative control)', () => {
    /** A load-shaped function that picks its entity from the route params, kept local to this control. */
    function entityFromParams({ params }: { params: Record<string, string> }): string {
      return `${params.entityType}/${params.entityId}`;
    }

    const { params, paramReads } = recordingParams({ ...ENTITY_PARAMS, questionId: 'q-1' });

    expect(entityFromParams({ params })).toBe(`candidate/${CANDIDATE_ID}`);
    expect(paramReads, 'the Proxy failed to record a param read, so the assertions above prove nothing').toEqual([
      'entityType',
      'entityId'
    ]);
  });

  it('the route Proxy throws on a read, and the event Proxy records which members were taken (negative control)', () => {
    /** A load-shaped function that takes the route from its event, kept local to this control. */
    function routeIdOf({ route }: { route: { id: string } }): string {
      return route.id;
    }

    const { event, eventReads } = recordingEvent('http://localhost/contestant', {});

    expect(() => routeIdOf(event as unknown as { route: { id: string } })).toThrow(/route\.id/);
    expect(eventReads, 'the event Proxy failed to record which member was taken').toEqual(['route']);
  });
});
