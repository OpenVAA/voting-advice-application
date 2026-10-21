/**
 * The load of an entity's nominations tree states the facts the nominations view and the nomination editor both rest on: whether the nominations may be edited, which elections admit the entity's type, and which of its nominations the editor manages.
 *
 * The load is driven directly with a fake event whose `parent` resolves the parent loads' data. The event is a recording Proxy, so the last case can say which of its members the load took.
 */

import { describe, expect, it } from 'vitest';
import { load } from './+layout';
import type { ElectionData } from '@openvaa/data';

const ENTITY_ID = '11111111-1111-4111-8111-111111111111';

/** One election of each nomination shape, and a second-round election that admits candidates alone. */
const ELECTION_DATA: Array<ElectionData> = [
  { id: 'closed', name: 'Closed lists', constituencyGroupIds: ['regions'], nominationShape: 'organization_list' },
  {
    id: 'open',
    name: 'Lists and independents',
    constituencyGroupIds: ['nation'],
    nominationShape: 'organization_list_and_independents'
  },
  { id: 'candidates', name: 'Candidates alone', constituencyGroupIds: ['nation'], nominationShape: 'candidate_only' },
  { id: 'parties', name: 'Parties alone', constituencyGroupIds: ['nation'], nominationShape: 'organization_only' },
  {
    id: 'second-round',
    name: 'Second round',
    constituencyGroupIds: ['nation'],
    nominationShape: 'candidate_only',
    multipleRounds: true,
    round: 2
  }
];

const CONSTITUENCY_DATA = {
  groups: [
    { id: 'nation', constituencyIds: ['whole-country'] },
    { id: 'regions', constituencyIds: ['region-1', 'region-2'] }
  ],
  constituencies: [
    { id: 'whole-country', name: 'The whole country' },
    { id: 'region-1', name: 'Region 1' },
    { id: 'region-2', name: 'Region 2' }
  ]
};

/** A nomination as far as the facts read one. */
type FakeNomination = { id: string; electionId: string; electionRound: number };

/** The data of the parent loads of an ungated user whose entity was read, with the parts a case replaces. */
function parentDataOf({
  entityType = 'candidate',
  nominations = [],
  access = {},
  overrides = {}
}: {
  entityType?: 'candidate' | 'organization';
  nominations?: Array<FakeNomination>;
  access?: { nominationsLocked?: boolean; answersLocked?: boolean };
  overrides?: Record<string, unknown>;
} = {}): Record<string, unknown> {
  return {
    gate: null,
    entities: [{ type: entityType, id: ENTITY_ID, confirmed: true }],
    contestantUserData: { entity: { type: entityType, id: ENTITY_ID }, nominations },
    questionData: { categories: [], questions: [] },
    appSettingsData: { access },
    electionData: ELECTION_DATA,
    constituencyData: CONSTITUENCY_DATA,
    ...overrides
  };
}

/** An event whose `parent` resolves `parentData`, and the names of the members the load took from it. */
function eventOf(parentData: Record<string, unknown>) {
  const eventReads: Array<string> = [];
  const event = new Proxy(
    {
      params: { entityType: 'candidate', entityId: ENTITY_ID },
      parent: async () => parentData,
      url: new URL(`http://localhost/contestant/candidate/${ENTITY_ID}/nominations`)
    },
    {
      get(target, prop) {
        if (typeof prop === 'string') eventReads.push(prop);
        return Reflect.get(target, prop, target);
      }
    }
  );
  return { event: event as unknown as Parameters<typeof load>[0], eventReads };
}

/** The facts the load states for the parent data given. */
async function factsOf(parentData: Record<string, unknown>) {
  return (await load(eventOf(parentData).event)).nominationFacts;
}

describe('contestant/(protected)/[entityType]/[entityId]/nominations/+layout.ts', () => {
  it('states no facts while a user-level gate is pending', async () => {
    expect(await factsOf({ gate: 'termsOfUse', user: {} })).toBeUndefined();
    expect(await factsOf(parentDataOf({ overrides: { gate: 'termsOfUse' } }))).toBeUndefined();
  });

  it("states no facts when the parent's data holds no entity or no list of its nominations", async () => {
    expect(await factsOf(parentDataOf({ overrides: { contestantUserData: undefined } }))).toBeUndefined();
    expect(
      await factsOf(
        parentDataOf({ overrides: { contestantUserData: { entity: { type: 'candidate', id: ENTITY_ID } } } })
      )
    ).toBeUndefined();
  });

  it.each(['appSettingsData', 'electionData', 'constituencyData'])(
    'states no facts when the root load could not read %s',
    async (member) => {
      expect(await factsOf(parentDataOf({ overrides: { [member]: new Error('the read failed') } }))).toBeUndefined();
    }
  );

  it('admits a candidate to every election but the one for parties alone, in the order of the elections', async () => {
    expect((await factsOf(parentDataOf({ entityType: 'candidate' })))?.admissibleElectionIds).toEqual([
      'closed',
      'open',
      'candidates',
      'second-round'
    ]);
  });

  it('admits a party to the two list elections and the one for parties alone', async () => {
    expect((await factsOf(parentDataOf({ entityType: 'organization' })))?.admissibleElectionIds).toEqual([
      'closed',
      'open',
      'parties'
    ]);
  });

  it("holds in the editor's reach the nominations at their election's current round in an election that admits the entity", async () => {
    const nominations: Array<FakeNomination> = [
      { id: 'in-closed', electionId: 'closed', electionRound: 1 },
      { id: 'in-parties', electionId: 'parties', electionRound: 1 },
      { id: 'in-an-earlier-round', electionId: 'second-round', electionRound: 1 },
      { id: 'in-the-current-round', electionId: 'second-round', electionRound: 2 },
      { id: 'in-no-election', electionId: 'unknown', electionRound: 1 }
    ];

    expect((await factsOf(parentDataOf({ entityType: 'candidate', nominations })))?.inReachNominationIds).toEqual([
      'in-closed',
      'in-the-current-round'
    ]);
    expect((await factsOf(parentDataOf({ entityType: 'organization', nominations })))?.inReachNominationIds).toEqual([
      'in-closed',
      'in-parties'
    ]);
    expect((await factsOf(parentDataOf()))?.inReachNominationIds).toEqual([]);
  });

  it.each([
    { title: 'neither lock is on', access: {}, editable: true },
    { title: 'both locks are stated off', access: { nominationsLocked: false, answersLocked: false }, editable: true },
    { title: 'nominations are locked', access: { nominationsLocked: true }, editable: false },
    { title: 'answers are locked', access: { answersLocked: true }, editable: false },
    { title: 'both locks are on', access: { nominationsLocked: true, answersLocked: true }, editable: false }
  ])('says the nominations are editable: $editable when $title', async ({ access, editable }) => {
    expect((await factsOf(parentDataOf({ access })))?.editable).toBe(editable);
  });

  it('takes parent from the event and nothing else', async () => {
    const { event, eventReads } = eventOf(parentDataOf());

    expect((await load(event)).nominationFacts).toBeDefined();
    expect(eventReads).toEqual(['parent']);
  });
});
