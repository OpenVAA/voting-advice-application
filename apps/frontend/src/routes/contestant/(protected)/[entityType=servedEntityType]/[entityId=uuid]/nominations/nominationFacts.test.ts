/**
 * Whether another nomination can be added, as `nominationFactsOf` answers it: while nominations may be edited, an election that admits the entity's type is one in which the entity holds no nomination the editor manages. The editor chooses one constituency in each election, so an election the entity already stands in leaves nothing to add in it.
 *
 * The facts are asked of a real `DataRoot` that holds the elections and their constituencies, with the settings the case names.
 */

import { DataRoot } from '@openvaa/data';
import { describe, expect, it } from 'vitest';
import { nominationFactsOf } from './nominationFacts';
import type { ElectionData } from '@openvaa/data';
import type { EntityNomination } from '$lib/api/base/dataWriter.type';

/** A closed-list election held in two regions, an election held in the whole country, and one that admits parties alone. */
const ELECTION_DATA: Array<ElectionData> = [
  { id: 'closed', name: 'Closed lists', constituencyGroupIds: ['regions'], nominationShape: 'organization_list' },
  {
    id: 'open',
    name: 'Lists and independents',
    constituencyGroupIds: ['nation'],
    nominationShape: 'organization_list_and_independents'
  },
  { id: 'parties', name: 'Parties alone', constituencyGroupIds: ['nation'], nominationShape: 'organization_only' }
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

/** A nomination of the entity, at the election's first round. */
function nomination(id: string, electionId: string, constituencyId: string, electionRound = 1): EntityNomination {
  return {
    id,
    electionId,
    electionName: electionId,
    constituencyId,
    constituencyName: constituencyId,
    electionRound,
    electionSymbol: '',
    confirmed: true,
    customData: null,
    updatedAt: '2026-10-01T12:00:00+00:00'
  };
}

/** Whether the facts say another nomination can be added. */
function canAddAnother({
  entityType = 'candidate',
  nominations = [],
  access = {}
}: {
  entityType?: 'candidate' | 'organization';
  nominations?: Array<EntityNomination>;
  access?: { nominationsLocked?: boolean; answersLocked?: boolean };
}): unknown {
  const dataRoot = new DataRoot();
  dataRoot.provideElectionData(ELECTION_DATA);
  dataRoot.provideConstituencyData(CONSTITUENCY_DATA);
  const appSettings = { access } as AppSettings;
  return nominationFactsOf({ selectionData: { appSettings, dataRoot }, entityType, nominations }).canAddAnother;
}

describe('nominationFactsOf — whether another nomination can be added', () => {
  it('is true for an entity with no nomination while an election admits it', () => {
    expect(canAddAnother({})).toBe(true);
  });

  it('is true while an election that admits the entity holds no nomination of it', () => {
    expect(canAddAnother({ nominations: [nomination('n-1', 'closed', 'region-1')] })).toBe(true);
  });

  it('is false once the entity stands in every election that admits it, though a region of one is free', () => {
    expect(
      canAddAnother({
        nominations: [nomination('n-1', 'closed', 'region-1'), nomination('n-2', 'open', 'whole-country')]
      })
    ).toBe(false);
  });

  it('reads the elections that admit the entity type alone', () => {
    const nominations = [nomination('n-1', 'closed', 'region-1'), nomination('n-2', 'open', 'whole-country')];
    expect(canAddAnother({ entityType: 'candidate', nominations })).toBe(false);
    expect(canAddAnother({ entityType: 'organization', nominations })).toBe(true);
  });

  it("counts no nomination outside the editor's reach, as one at another round", () => {
    expect(
      canAddAnother({
        nominations: [nomination('n-1', 'closed', 'region-1'), nomination('n-2', 'open', 'whole-country', 2)]
      })
    ).toBe(true);
  });

  it.each([
    ['the nominations lock', { nominationsLocked: true }],
    ['the answers lock', { answersLocked: true }],
    ['both locks', { nominationsLocked: true, answersLocked: true }]
  ])('is false under %s', (_, access) => {
    expect(canAddAnother({ access })).toBe(false);
  });
});
