/**
 * The entity-level load of the Contestant App's protected tree depends on the two entity params and on nothing else of the URL, the route or the params.
 *
 * SvelteKit reruns a load whenever a `url` property, `route.id` or a param it read TRACKED changes. This load reads the entity the URL names, so it reads `entityType` and `entityId` and reruns when the selected entity changes. Any other tracked read, of `questionId` above all, would rerun it, and with it the entity and question reads, on every navigation between the pages of one entity. It takes `fetch`, `locals`, `params` and `parent` from the request event and nothing else.
 *
 * The load is driven DIRECTLY with a fake event that is itself a recording Proxy, and whose members are instruments:
 * - `url` records every property read that happens outside the event's own `untrack`;
 * - `route` throws on any read;
 * - `params` records every param name read;
 * - `parent` resolves the user-level load's data for an ungated user.
 *
 * Correctness invariants, each one a distinct way this file could hand back a false pass:
 * 1. Each instrument must actually record. A trap that never pushed would make every assertion below `[] === []`. The control cases at the foot of this file are the answer, one per instrument.
 * 2. The `untrack` counter must actually suppress, or a load reading the URL untracked would be reported. The `url` control asserts that the read it makes INSIDE `untrack` is absent from the recorded set.
 * 3. The subject must be the REAL load, run to its end: the positive cases import `load` from `./+layout.server` and assert the resolved entity data. The controls deliberately do not import it.
 */

import { describe, expect, it, vi } from 'vitest';
import { load } from './+layout.server';
import { forbiddenRoute, recordingParams, recordingUrl } from '../../loadTracking.testUtils';
import type { Untrack } from '../../loadTracking.testUtils';

const { createDataProvider, createDataWriter } = vi.hoisted(() => ({
  createDataProvider: vi.fn(),
  createDataWriter: vi.fn()
}));

// Hoisted because `vi.mock`'s factory is lifted above every import and cannot close over an ordinary module-scope binding.
vi.mock('$lib/api/dataWriter', () => ({ createDataWriter }));
vi.mock('$lib/api/dataProvider', () => ({ createDataProvider }));

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
const ENTITY_DATA = {
  entity: { type: 'candidate', id: CANDIDATE_ID },
  nominations: [{ electionId: 'election-1', constituencyId: 'constituency-1' }]
};
const QUESTION_DATA = { categories: [], questions: [] };

/** The params of a URL that names the candidate. */
const ENTITY_PARAMS = { entityType: 'candidate', entityId: CANDIDATE_ID };
/** The path of the candidate's home. */
const ENTITY_HOME = `/contestant/candidate/${CANDIDATE_ID}`;

/**
 * A request event below an ungated user-level load that lists one served entity, with every instrument in place.
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
      locals: { supabase: { auth: { signOut: vi.fn() } } },
      params,
      parent: async () => ({ gate: null, user: USER, entities: [CANDIDATE] }),
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

describe('contestant/(protected)/[entityType]/[entityId]/+layout.server.ts load dependency tracking', () => {
  it.each([
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
      createDataWriter.mockReturnValue({ getEntityUserData: async () => ENTITY_DATA });
      createDataProvider.mockReturnValue({ getQuestionData: async () => QUESTION_DATA });
      const { event, eventReads, paramReads, trackedReads } = recordingEvent(`http://localhost${path}`, routeParams);

      const result = await load(event);

      expect(trackedReads, 'a tracked url read makes SvelteKit rerun this load on every navigation').toEqual([]);
      expect(
        [...new Set(paramReads)].sort(),
        'the load reruns when the selected entity changes, and on no other param'
      ).toEqual(['entityId', 'entityType']);
      expect(
        paramReads,
        'a read of questionId would rerun this load on every navigation between two questions'
      ).not.toContain('questionId');
      expect(
        [...new Set(eventReads)].sort(),
        'the load takes fetch, locals, params and parent from the event and nothing else'
      ).toEqual(['fetch', 'locals', 'params', 'parent']);
      // The load ran to its end, so every stage had the chance to read.
      expect(result).toEqual({ questionData: QUESTION_DATA, contestantUserData: ENTITY_DATA });
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
    /** An entity picked from a tracked path, kept local to this control. */
    function entityFromPath({ url, untrack }: { url: URL; untrack: Untrack }): string {
      // An untracked read, exercised so the counter's suppression is covered as well as its recording.
      untrack(() => url.searchParams.get('start'));
      // Tracked.
      return url.pathname.split('/')[2];
    }

    const { url, trackedReads, untrack } = recordingUrl('http://localhost/contestant/profile?start=true');

    expect(entityFromPath({ url, untrack })).toBe('profile');
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

    const { event, eventReads } = recordingEvent(`http://localhost${ENTITY_HOME}`, ENTITY_PARAMS);

    expect(() => routeIdOf(event as unknown as { route: { id: string } })).toThrow(/route\.id/);
    expect(eventReads, 'the event Proxy failed to record which member was taken').toEqual(['route']);
  });
});
