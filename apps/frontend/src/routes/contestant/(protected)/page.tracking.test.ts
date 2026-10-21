/**
 * The server load of the Contestant App's root page must not depend on the URL, the route or a route param.
 *
 * SvelteKit reruns a load whenever a `url` property, `route.id` or a param it read TRACKED changes. This load decides what a user who names no entity gets, on its parent's list alone, so it takes `parent` from the request event and nothing else.
 *
 * The load is driven DIRECTLY with a fake event that is itself a recording Proxy, and whose members are instruments:
 * - `url` records every property read that happens outside the event's own `untrack`;
 * - `route` throws on any read;
 * - `params` records every param name read;
 * - `parent` resolves the user-level load's data for the state the case names.
 *
 * A redirect the load throws is caught by the case: the reads recorded up to it are what is asserted.
 *
 * Correctness invariants, each one a distinct way this file could hand back a false pass:
 * 1. Each instrument must actually record. A trap that never pushed would make every assertion below `[] === []`. The control cases at the foot of this file are the answer, one per instrument.
 * 2. The `untrack` counter must actually suppress, or a load reading the URL untracked would be reported. The `url` control asserts that the read it makes INSIDE `untrack` is absent from the recorded set.
 * 3. The subject must be the REAL load, run past its parent: the positive cases import `load` from `./+page.server`, and every case asserts the outcome only the real load produces for its state. The controls deliberately do not import it.
 */

import { describe, expect, it, vi } from 'vitest';
import { load } from './+page.server';
import { forbiddenRoute, recordingParams, recordingUrl } from './loadTracking.testUtils';
import type { Untrack } from './loadTracking.testUtils';

const USER = {
  id: 'user-1',
  email: 'user@example.test',
  username: 'user@example.test',
  role: 'contestant',
  settings: {},
  termsOfUseAccepted: '2026-10-06T00:54:12.277826+00:00',
  passwordSet: true
};
const CANDIDATE = {
  type: 'candidate',
  id: '11111111-1111-4111-8111-111111111111',
  firstName: 'A',
  lastName: 'B',
  confirmed: true
};
const ORGANIZATION = { type: 'organization', id: '22222222-2222-4222-8222-222222222222', name: 'Org', confirmed: true };

/** The states of the user-level load the root load decides on. */
const PARENT_STATES = {
  'a pending gate': { gate: 'termsOfUse', user: USER },
  'no entity': { gate: null, user: USER, entities: [] },
  'one entity': { gate: null, user: USER, entities: [CANDIDATE] },
  'several entities': { gate: null, user: USER, entities: [CANDIDATE, ORGANIZATION] }
};

/**
 * A request event for the app root, which carries no route param, with every instrument in place.
 * @param href - The URL of the request.
 * @param parentData - What the user-level load resolves to.
 * @returns The event and what its instruments recorded.
 */
function recordingEvent(href: string, parentData: unknown) {
  const { url, trackedReads, untrack } = recordingUrl(href);
  const { params, paramReads } = recordingParams({});
  const eventReads: Array<string> = [];
  const event = new Proxy(
    {
      fetch: vi.fn(),
      locals: { supabase: { auth: { signOut: vi.fn(async () => ({ error: null })) } } },
      params,
      parent: async () => parentData,
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

/** What the load resolved to or threw. */
async function outcomeOf(event: Parameters<typeof load>[0]): Promise<{ resolved?: unknown; thrown?: unknown }> {
  try {
    return { resolved: await load(event) };
  } catch (e) {
    return { thrown: e };
  }
}

describe('contestant/(protected)/+page.server.ts load dependency tracking', () => {
  const cases = Object.keys(PARENT_STATES).flatMap((state) =>
    ['/contestant', '/contestant?redirectTo=contestant%2Fprofile'].map((path) => [state, path] as const)
  ) as Array<readonly [keyof typeof PARENT_STATES, string]>;

  it.each(cases)('reads no URL property tracked, no route and no param (%s, %s)', async (state, path) => {
    const { event, eventReads, paramReads, trackedReads } = recordingEvent(
      `http://localhost${path}`,
      PARENT_STATES[state]
    );

    const outcome = await outcomeOf(event);

    expect(trackedReads, 'a tracked url read makes SvelteKit rerun this load on every navigation').toEqual([]);
    expect(paramReads, 'the app root carries no entity, so this load has no param to depend on').toEqual([]);
    expect([...new Set(eventReads)].sort(), 'the load takes parent from the event and nothing else').toEqual([
      'parent'
    ]);
    // The load ran past its parent, so every branch had the chance to read.
    if (state === 'a pending gate') expect(outcome).toEqual({ resolved: {} });
    if (state === 'no entity') expect(outcome).toEqual({ resolved: { view: 'nothingToEdit' } });
    if (state === 'one entity')
      expect(outcome.thrown).toMatchObject({
        status: 307,
        location: '/contestant/candidate/11111111-1111-4111-8111-111111111111'
      });
    if (state === 'several entities') expect(outcome).toEqual({ resolved: { view: 'select' } });
  });

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

    const { url, trackedReads, untrack } = recordingUrl('http://localhost/contestant?redirectTo=x');
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

  it('the recording params Proxy records a read of a param the route does not carry (negative control)', () => {
    /** A load-shaped function that looks for an entity in the route params, kept local to this control. */
    function entityFromParams({ params }: { params: Record<string, string> }): string {
      return `${params.entityType}/${params.entityId}`;
    }

    const { params, paramReads } = recordingParams({});

    expect(entityFromParams({ params })).toBe('undefined/undefined');
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

    const { event, eventReads } = recordingEvent('http://localhost/contestant', PARENT_STATES['a pending gate']);

    expect(() => routeIdOf(event as unknown as { route: { id: string } })).toThrow(/route\.id/);
    expect(eventReads, 'the event Proxy failed to record which member was taken').toEqual(['route']);
  });
});
