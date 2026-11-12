/**
 * The server load that resolves an entity page asked for without an entity depends on the `page` param and on nothing else of the URL, the route or the params.
 *
 * SvelteKit reruns a load whenever a `url` property, `route.id` or a param it read TRACKED changes. This load redirects to the page its `page` param names under the user's one entity, so it takes `params` and `parent` from the request event and nothing else, and the query string of the request is never read.
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
 * 3. The subject must be the REAL load, run to its redirect: the positive cases import `load` from `./+page.server` and assert the target only the real load builds. The controls deliberately do not import it.
 */

import { describe, expect, it, vi } from 'vitest';
import { load } from './+page.server';
import { forbiddenRoute, recordingParams, recordingUrl } from '../loadTracking.testUtils';
import type { Untrack } from '../loadTracking.testUtils';

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
const QUESTION_ID = '33333333-3333-4333-8333-333333333333';
const CANDIDATE = { type: 'candidate', id: CANDIDATE_ID, firstName: 'A', lastName: 'B', confirmed: true };
const ORGANIZATION = { type: 'organization', id: '22222222-2222-4222-8222-222222222222', name: 'Org', confirmed: true };

/** The five forms of sub-path the route's matcher admits. */
const SUB_PATHS = ['profile', 'questions', `questions/${QUESTION_ID}`, 'preview', 'settings'];

/**
 * A request event for an entity-less path, with every instrument in place.
 * @param href - The URL of the request.
 * @param page - The sub-path the URL names, which is the route's one param.
 * @param parentData - What the user-level load resolves to.
 * @returns The event and what its instruments recorded.
 */
function recordingEvent(href: string, page: string, parentData: unknown) {
  const { url, trackedReads, untrack } = recordingUrl(href);
  const { params, paramReads } = recordingParams({ page });
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

describe('contestant/(protected)/[...page]/+page.server.ts load dependency tracking', () => {
  it.each(SUB_PATHS.flatMap((page) => ['', '?start=true'].map((query) => [page, query] as const)))(
    'reads the page param and no other, no URL property tracked and no route (%s%s)',
    async (page, query) => {
      const { event, eventReads, paramReads, trackedReads } = recordingEvent(
        `http://localhost/contestant/${page}${query}`,
        page,
        { gate: null, user: USER, entities: [CANDIDATE] }
      );

      const outcome = await outcomeOf(event);

      expect(trackedReads, 'a tracked url read would make the load depend on the query string').toEqual([]);
      expect([...new Set(paramReads)], 'the load resolves the sub-path and depends on no other param').toEqual([
        'page'
      ]);
      expect(
        [...new Set(eventReads)].sort(),
        'the load takes params and parent from the event and nothing else'
      ).toEqual(['params', 'parent']);
      // The load ran to its redirect, so every branch had the chance to read.
      expect(outcome.thrown).toMatchObject({
        status: 307,
        location: `/contestant/candidate/${CANDIDATE_ID}/${page}`
      });
    }
  );

  it.each([
    ['a pending gate', { gate: 'termsOfUse', user: USER }],
    ['no entity', { gate: null, user: USER, entities: [] }],
    ['several entities', { gate: null, user: USER, entities: [CANDIDATE, ORGANIZATION] }]
  ])('reads no URL property tracked, no route and no param other than page for %s', async (_, parentData) => {
    const { event, eventReads, paramReads, trackedReads } = recordingEvent(
      'http://localhost/contestant/profile?start=true',
      'profile',
      parentData
    );

    await outcomeOf(event);

    expect(trackedReads).toEqual([]);
    expect(paramReads.filter((name) => name !== 'page')).toEqual([]);
    expect([...new Set(eventReads)].sort()).toEqual(['params', 'parent']);
  });

  /**
   * Negative controls: the assertions above are only meaningful if each instrument can catch what it guards against.
   *
   * Each subject is a LOCAL load-shaped function. None imports the real `load`: that would make the control a test of production code rather than of the instrument.
   *
   * NAMED LIMIT: these prove the INSTRUMENTS work. They do not prove the real load was ever wrong.
   */
  it('the recording url Proxy catches a tracked url.search read (negative control)', () => {
    /** A redirect target that carries the query string over, kept local to this control. */
    function targetWithQuery({ url, untrack }: { url: URL; untrack: Untrack }): string {
      // An untracked read, exercised so the counter's suppression is covered as well as its recording.
      untrack(() => url.searchParams.get('start'));
      // Tracked.
      return `/contestant/candidate/${CANDIDATE_ID}/profile${url.search}`;
    }

    const { url, trackedReads, untrack } = recordingUrl('http://localhost/contestant/profile?start=true');
    targetWithQuery({ url, untrack });

    expect(
      trackedReads,
      'the Proxy failed to record a tracked url.search read, so the assertions above prove nothing'
    ).toEqual(['search']);
    expect(
      trackedReads,
      'the untrack counter failed to suppress a read inside it, so a legitimate untracked read would be reported'
    ).not.toEqual(expect.arrayContaining(['searchParams']));
  });

  it('the recording params Proxy records a read of a param other than page (negative control)', () => {
    /** A load-shaped function that reads a param this route does not carry, kept local to this control. */
    function pageUnderEntity({ params }: { params: Record<string, string> }): string {
      return `${params.entityType}/${params.page}`;
    }

    const { params, paramReads } = recordingParams({ page: 'profile' });

    expect(pageUnderEntity({ params })).toBe('undefined/profile');
    expect(paramReads, 'the Proxy failed to record a param read, so the assertions above prove nothing').toEqual([
      'entityType',
      'page'
    ]);
  });

  it('the route Proxy throws on a read, and the event Proxy records which members were taken (negative control)', () => {
    /** A load-shaped function that takes the route from its event, kept local to this control. */
    function routeIdOf({ route }: { route: { id: string } }): string {
      return route.id;
    }

    const { event, eventReads } = recordingEvent('http://localhost/contestant/profile', 'profile', {
      gate: 'termsOfUse',
      user: USER
    });

    expect(() => routeIdOf(event as unknown as { route: { id: string } })).toThrow(/route\.id/);
    expect(eventReads, 'the event Proxy failed to record which member was taken').toEqual(['route']);
  });
});
