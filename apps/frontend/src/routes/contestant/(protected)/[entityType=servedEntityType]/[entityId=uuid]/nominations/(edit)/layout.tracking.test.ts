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
 * 1. Each instrument must actually record. A trap that never pushed would make every assertion below `[] === []`. The controls in `loadTracking.testUtils.test.ts` are the answer, one per instrument.
 * 2. The `untrack` counter must actually suppress, or a load reading the URL untracked would be reported. The `url` control there asserts that the read it makes INSIDE `untrack` is absent from the recorded set.
 * 3. The subject must be the REAL load, run to its end on both of its paths: the positive cases import `load` from `./+layout` and assert the empty object it resolves for an entity the editor is served to and the redirect it throws for every other.
 */

import { describe, expect, it } from 'vitest';
import { load } from './+layout';
import { recordingEvent } from '../../../../loadTracking.testUtils';
import type { NominationScope } from '../nominationScope';

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
const SERVED: NominationScope = {
  editable: true,
  admissibleElectionIds: ['election-1', 'election-2'],
  writableNominationIds: [],
  canAddAnother: true
};

/** The facts of every entity the editor is served to, by what it holds. */
const SERVED_ENTITIES: Array<{ title: string; facts: NominationScope }> = [
  { title: 'no nomination', facts: SERVED },
  {
    title: 'a writable nomination',
    facts: { ...SERVED, writableNominationIds: ['nomination-1'] }
  }
];

/** The facts of every entity the editor is not served to, by what turns it away. */
const TURNED_AWAY: Array<{ title: string; facts: NominationScope }> = [
  { title: 'a lock is on', facts: { ...SERVED, editable: false } },
  { title: "no election admits the entity's type", facts: { ...SERVED, admissibleElectionIds: [] } },
  {
    title: 'a lock is on and the entity holds a nomination',
    facts: { ...SERVED, editable: false, writableNominationIds: ['nomination-1'] }
  }
];

/** The parent loads' data of an ungated user whose entity has the facts given. */
function ungated(nominationScope: NominationScope | undefined): Record<string, unknown> {
  return { gate: null, nominationScope };
}

describe('contestant/(protected)/[entityType]/[entityId]/nominations/(edit)/+layout.ts load dependency tracking', () => {
  describe.each(SERVED_ENTITIES)('for an editable entity that holds $title', ({ facts }) => {
    it.each(STEP_ADDRESSES)(
      'serves the editor on no URL property tracked, no route and no param but the two entity params (%s)',
      async (path) => {
        const { event, eventReads, paramReads, trackedReads } = recordingEvent<Parameters<typeof load>[0]>({
          href: `http://localhost${path}`,
          params: ENTITY_PARAMS,
          parent: async () => ungated(facts)
        });

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
        const { event, eventReads, paramReads, trackedReads } = recordingEvent<Parameters<typeof load>[0]>({
          href: `http://localhost${path}`,
          params: ENTITY_PARAMS,
          parent: async () => ungated(facts)
        });

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
    { title: 'a user-level gate is pending', parentData: { gate: 'termsOfUse', nominationScope: undefined } },
    {
      title: 'a user-level gate is pending, whatever the facts say',
      parentData: { gate: 'termsOfUse', nominationScope: { ...SERVED, editable: false } }
    },
    { title: "the parent's data holds no facts", parentData: ungated(undefined) }
  ])('decides nothing and redirects nowhere while $title', async ({ parentData }) => {
    const { event, eventReads, paramReads, trackedReads } = recordingEvent<Parameters<typeof load>[0]>({
      href: `http://localhost${NOMINATIONS_VIEW}/details?${SELECTION}`,
      params: ENTITY_PARAMS,
      parent: async () => parentData
    });

    expect(await load(event)).toEqual({});
    expect(trackedReads).toEqual([]);
    expect(paramReads, 'no target is built, so no param is read').toEqual([]);
    expect([...new Set(eventReads)].sort()).toEqual(['params', 'parent']);
  });
});
