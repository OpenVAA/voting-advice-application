/**
 * The load of the route group that holds the nomination editor's three steps depends on the two entity params and on nothing else of the URL, the route or the params, and serves the editor to an entity whose nominations may be edited and that has an election to stand in, whether or not it holds a nomination already.
 *
 * SvelteKit reruns a load whenever a `url` property, `route.id` or a param it read TRACKED changes. The steps pass the chosen elections and constituencies on in search params, so a tracked read of the URL here would rerun this load, and with it every parent load it awaits, on every step. The load builds the entity's nominations view from `entityType` and `entityId`, and may read those two. It takes `params` and `parent` from the request event and nothing else.
 *
 * The load is driven DIRECTLY with a fake event that is itself a recording Proxy, and whose members are instruments:
 * - `url` records every property read that happens outside the event's own `untrack`;
 * - `route` throws on any read;
 * - `params` records every param name read;
 * - `parent` resolves the parent loads' data for an ungated user, with the facts of the entity's nominations.
 *
 * Correctness invariants, each one a distinct way this file could hand back a false pass:
 * 1. Each instrument must actually record. A trap that never pushed would make every assertion below `[] === []`. The control cases at the foot of this file are the answer, one per instrument.
 * 2. The `untrack` counter must actually suppress, or a load reading the URL untracked would be reported. The `url` control asserts that the read it makes INSIDE `untrack` is absent from the recorded set.
 * 3. The subject must be the REAL load, run to its end on both of its paths: the positive cases import `load` from `./+layout` and assert the empty object it resolves for an entity the editor is served to and the redirect it throws for every other. The controls deliberately do not import it.
 */

import { describe, expect, it } from 'vitest';
import { load } from './+layout';
import { forbiddenRoute, recordingParams, recordingUrl } from '../../../../loadTracking.testUtils';
import type { Untrack } from '../../../../loadTracking.testUtils';
import type { NominationFacts } from '../nominationFacts';

const CANDIDATE_ID = '11111111-1111-4111-8111-111111111111';

/** The params of a URL that names the candidate. */
const ENTITY_PARAMS = { entityType: 'candidate', entityId: CANDIDATE_ID };
/** The path of the candidate's home, and of its nominations view. */
const ENTITY_HOME = `/contestant/candidate/${CANDIDATE_ID}`;
const NOMINATIONS_VIEW = `${ENTITY_HOME}/nominations`;

/** The search params a step's address can carry. */
const SELECTION = 'nominationElectionId=election-1&nominationElectionId=election-2&nominationConstituencyId=region-1';

/** Every step of the editor, with and without a selection in its address. */
const STEP_ADDRESSES: Array<[string]> = [
  [`${NOMINATIONS_VIEW}/elections`],
  [`${NOMINATIONS_VIEW}/elections?${SELECTION}`],
  [`${NOMINATIONS_VIEW}/constituencies`],
  [`${NOMINATIONS_VIEW}/constituencies?${SELECTION}`],
  [`${NOMINATIONS_VIEW}/details`],
  [`${NOMINATIONS_VIEW}/details?${SELECTION}`]
];

/** The facts of an entity the editor is served to: editable, with an election to stand in and no nomination yet. */
const SERVED: NominationFacts = {
  editable: true,
  admissibleElectionIds: ['election-1', 'election-2'],
  inReachNominationIds: []
};

/** The facts of every entity the editor is served to, by what it holds. */
const SERVED_ENTITIES: Array<{ title: string; facts: NominationFacts }> = [
  { title: 'no nomination', facts: SERVED },
  {
    title: "a nomination in the editor's reach",
    facts: { ...SERVED, inReachNominationIds: ['nomination-1'] }
  }
];

/** The facts of every entity the editor is not served to, by what turns it away. */
const TURNED_AWAY: Array<{ title: string; facts: NominationFacts }> = [
  { title: 'a lock is on', facts: { ...SERVED, editable: false } },
  { title: "no election admits the entity's type", facts: { ...SERVED, admissibleElectionIds: [] } },
  {
    title: 'a lock is on and the entity holds a nomination',
    facts: { ...SERVED, editable: false, inReachNominationIds: ['nomination-1'] }
  }
];

/**
 * A request event below the parent loads, with every instrument in place.
 * @param href - The URL of the request.
 * @param parentData - What the parent loads resolved.
 * @returns The event and what its instruments recorded.
 */
function recordingEvent(href: string, parentData: Record<string, unknown>) {
  const { url, trackedReads, untrack } = recordingUrl(href);
  const { params, paramReads } = recordingParams(ENTITY_PARAMS);
  const eventReads: Array<string> = [];
  const event = new Proxy(
    {
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

/** The parent loads' data of an ungated user whose entity has the facts given. */
function ungated(nominationFacts: NominationFacts | undefined): Record<string, unknown> {
  return { gate: null, nominationFacts };
}

describe('contestant/(protected)/[entityType]/[entityId]/nominations/(edit)/+layout.ts load dependency tracking', () => {
  describe.each(SERVED_ENTITIES)('for an editable entity that holds $title', ({ facts }) => {
    it.each(STEP_ADDRESSES)(
      'serves the editor on no URL property tracked, no route and no param but the two entity params (%s)',
      async (path) => {
        const { event, eventReads, paramReads, trackedReads } = recordingEvent(
          `http://localhost${path}`,
          ungated(facts)
        );

        const result = await load(event);

        expect(trackedReads, 'a tracked url read makes SvelteKit rerun this load on every step').toEqual([]);
        expect(
          paramReads.filter((name) => name !== 'entityType' && name !== 'entityId'),
          'the load reads no param but the two that name the entity'
        ).toEqual([]);
        expect(eventReads, 'the load awaits its parent').toContain('parent');
        expect(
          eventReads.filter((name) => name !== 'params' && name !== 'parent'),
          'the load takes params and parent from the event and nothing else'
        ).toEqual([]);
        // The load ran to its end.
        expect(result).toEqual({});
      }
    );
  });

  describe.each(TURNED_AWAY)('when $title', ({ facts }) => {
    it.each(STEP_ADDRESSES)(
      'redirects to the nominations view on the two entity params and no other, no URL property tracked and no route (%s)',
      async (path) => {
        const { event, eventReads, paramReads, trackedReads } = recordingEvent(
          `http://localhost${path}`,
          ungated(facts)
        );

        // The load ran to its end on the path that builds a target, so every stage had the chance to read. The target carries nothing of the address asked for.
        await expect(load(event)).rejects.toMatchObject({ status: 307, location: NOMINATIONS_VIEW });

        expect(trackedReads, 'a tracked url read makes SvelteKit rerun this load on every step').toEqual([]);
        expect(
          [...new Set(paramReads)].sort(),
          'the target is the nominations view of the entity the URL names, built from its two params and no other'
        ).toEqual(['entityId', 'entityType']);
        expect(
          [...new Set(eventReads)].sort(),
          'the load takes params and parent from the event and nothing else'
        ).toEqual(['params', 'parent']);
      }
    );
  });

  it.each([
    { title: 'a user-level gate is pending', parentData: { gate: 'termsOfUse', nominationFacts: undefined } },
    {
      title: 'a user-level gate is pending, whatever the facts say',
      parentData: { gate: 'termsOfUse', nominationFacts: { ...SERVED, editable: false } }
    },
    { title: "the parent's data holds no facts", parentData: ungated(undefined) }
  ])('decides nothing and redirects nowhere while $title', async ({ parentData }) => {
    const { event, eventReads, paramReads, trackedReads } = recordingEvent(
      `http://localhost${NOMINATIONS_VIEW}/details?${SELECTION}`,
      parentData
    );

    expect(await load(event)).toEqual({});
    expect(trackedReads).toEqual([]);
    expect(paramReads, 'no target is built, so no param is read').toEqual([]);
    expect([...new Set(eventReads)].sort()).toEqual(['params', 'parent']);
  });

  /**
   * Negative controls: the assertions above are only meaningful if each instrument can catch what it guards against.
   *
   * Each subject is a LOCAL load-shaped function. None imports the real `load`: that would make the control a test of production code rather than of the instrument.
   *
   * NAMED LIMIT: these prove the INSTRUMENTS work. They do not prove the real load was ever wrong.
   */
  it('the recording url Proxy catches a tracked url.searchParams read (negative control)', () => {
    /** The elections of a tracked address, kept local to this control. */
    function electionsFromAddress({ url, untrack }: { url: URL; untrack: Untrack }): Array<string> {
      // An untracked read, exercised so the counter's suppression is covered as well as its recording.
      untrack(() => url.pathname);
      // Tracked.
      return url.searchParams.getAll('nominationElectionId');
    }

    const { url, trackedReads, untrack } = recordingUrl(`http://localhost${NOMINATIONS_VIEW}/details?${SELECTION}`);

    expect(electionsFromAddress({ url, untrack })).toEqual(['election-1', 'election-2']);
    expect(
      trackedReads,
      'the Proxy failed to record a tracked url.searchParams read, so the assertions above prove nothing'
    ).toEqual(['searchParams']);
    expect(
      trackedReads,
      'the untrack counter failed to suppress a read inside it, so a legitimate untracked read would be reported'
    ).not.toEqual(expect.arrayContaining(['pathname']));
  });

  it('the recording params Proxy records a param read (negative control)', () => {
    /** A load-shaped function that reads a param beside the two that name the entity, kept local to this control. */
    function stepFromParams({ params }: { params: Record<string, string> }): string {
      return `${params.entityId}/${params.step}`;
    }

    const { params, paramReads } = recordingParams({ ...ENTITY_PARAMS, step: 'details' });

    expect(stepFromParams({ params })).toBe(`${CANDIDATE_ID}/details`);
    expect(paramReads, 'the Proxy failed to record a param read, so the assertions above prove nothing').toEqual([
      'entityId',
      'step'
    ]);
  });

  it('the route Proxy throws on a read, and the event Proxy records which members were taken (negative control)', () => {
    /** A load-shaped function that takes the route from its event, kept local to this control. */
    function routeIdOf({ route }: { route: { id: string } }): string {
      return route.id;
    }

    const { event, eventReads } = recordingEvent(`http://localhost${NOMINATIONS_VIEW}/details`, ungated(SERVED));

    expect(() => routeIdOf(event as unknown as { route: { id: string } })).toThrow(/route\.id/);
    expect(eventReads, 'the event Proxy failed to record which member was taken').toEqual(['route']);
  });
});
