/**
 * Whether another nomination can be added, as `nominationScopeOf` answers it: while nominations may be edited, an election that admits the entity's type has room for one. A candidate chooses one constituency in each election, so an election it already stands in leaves nothing to add in it. An organization chooses several, so an election has room while one of its constituencies holds no nomination of it that the editor manages.
 *
 * The facts are asked of a real `DataRoot` that holds the elections and their constituencies, with the settings the case names.
 */

import { DataRoot } from '@openvaa/data';
import { describe, expect, it } from 'vitest';
import { nominationScopeOf } from './nominationScope';
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

/** A nomination of the entity, at the election's first round, writable unless stated otherwise. */
function nomination(id: string, electionId: string, constituencyId: string, writable = true): EntityNomination {
  return {
    id,
    electionId,
    electionName: electionId,
    constituencyId,
    constituencyName: constituencyId,
    electionRound: 1,
    electionSymbol: '',
    confirmed: true,
    customData: null,
    updatedAt: '2026-10-01T12:00:00+00:00',
    writable
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
  access?: { contestantEditing?: 'open' | 'nominationsLocked' | 'locked' };
}): unknown {
  const dataRoot = new DataRoot();
  dataRoot.provideElectionData(ELECTION_DATA);
  dataRoot.provideConstituencyData(CONSTITUENCY_DATA);
  const appSettings = { access } as AppSettings;
  return nominationScopeOf({ selectionData: { appSettings, dataRoot }, entityType, nominations }).canAddAnother;
}

describe('nominationScopeOf — whether the entity chooses several constituencies in one election', () => {
  it('is true for an organization and false for a candidate', () => {
    const dataRoot = new DataRoot();
    dataRoot.provideElectionData(ELECTION_DATA);
    dataRoot.provideConstituencyData(CONSTITUENCY_DATA);
    const selectionData = { appSettings: { access: {} } as AppSettings, dataRoot };
    expect(
      nominationScopeOf({ selectionData, entityType: 'organization', nominations: [] }).severalConstituencies
    ).toBe(true);
    expect(nominationScopeOf({ selectionData, entityType: 'candidate', nominations: [] }).severalConstituencies).toBe(
      false
    );
  });
});

describe('nominationScopeOf — whether another nomination can be added', () => {
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

  it('is true for an organization while a constituency of an election it stands in is free', () => {
    const nominations = [
      nomination('n-1', 'closed', 'region-1'),
      nomination('n-2', 'open', 'whole-country'),
      nomination('n-3', 'parties', 'whole-country')
    ];
    expect(canAddAnother({ entityType: 'organization', nominations })).toBe(true);
  });

  it('is false for an organization once it stands in every constituency of every election that admits it', () => {
    const nominations = [
      nomination('n-1', 'closed', 'region-1'),
      nomination('n-2', 'closed', 'region-2'),
      nomination('n-3', 'open', 'whole-country'),
      nomination('n-4', 'parties', 'whole-country')
    ];
    expect(canAddAnother({ entityType: 'organization', nominations })).toBe(false);
  });

  it('counts no nomination that is not writable', () => {
    expect(
      canAddAnother({
        nominations: [nomination('n-1', 'closed', 'region-1'), nomination('n-2', 'open', 'whole-country', false)]
      })
    ).toBe(true);
  });

  it.each([
    ['the nominations lock', { contestantEditing: 'nominationsLocked' as const }],
    ['the lock on everything', { contestantEditing: 'locked' as const }]
  ])('is false under %s', (_, access) => {
    expect(canAddAnother({ access })).toBe(false);
  });
});
