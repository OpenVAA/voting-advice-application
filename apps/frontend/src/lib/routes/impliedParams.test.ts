import { dynamicSettings, staticSettings } from '@openvaa/app-shared';
import { DataRoot } from '@openvaa/data';
import { describe, expect, it } from 'vitest';
import { getImpliedConstituencyIds, getImpliedElectionIds } from './impliedParams';
import type { ElectionData } from '@openvaa/data';

/**
 * The elections a data root of these tests can hold. `national` has one constituency, `regional` and `municipal` one group of several each, and `mixed` both of those groups, so that a region chosen together with one of its municipalities matches it twice.
 */
const ELECTIONS = {
  national: { id: 'national', name: 'National', constituencyGroupIds: ['nation'] },
  regional: { id: 'regional', name: 'Regional', constituencyGroupIds: ['regions'] },
  municipal: { id: 'municipal', name: 'Municipal', constituencyGroupIds: ['municipalities'] },
  mixed: { id: 'mixed', name: 'Mixed', constituencyGroupIds: ['regions', 'municipalities'] }
} satisfies Record<string, ElectionData>;

/**
 * A data root that holds the named elections and every constituency group.
 */
function rootWith(...elections: Array<keyof typeof ELECTIONS>): DataRoot {
  const dataRoot = new DataRoot();
  dataRoot.provideElectionData(elections.map((id) => ELECTIONS[id]));
  dataRoot.provideConstituencyData({
    groups: [
      { id: 'nation', constituencyIds: ['whole-country'] },
      { id: 'regions', constituencyIds: ['region-1', 'region-2'] },
      { id: 'municipalities', constituencyIds: ['municipality-1a', 'municipality-1b', 'municipality-2a'] }
    ],
    constituencies: [
      { id: 'whole-country', name: 'The whole country' },
      { id: 'region-1', name: 'Region 1' },
      { id: 'region-2', name: 'Region 2' },
      { id: 'municipality-1a', name: 'Municipality 1a', parentId: 'region-1' },
      { id: 'municipality-1b', name: 'Municipality 1b', parentId: 'region-1' },
      { id: 'municipality-2a', name: 'Municipality 2a', parentId: 'region-2' }
    ]
  });
  return dataRoot;
}

/**
 * The shipped settings with the given election settings on top.
 */
function settingsWith(elections: Partial<AppSettings['elections']> = {}): AppSettings {
  return { ...staticSettings, ...dynamicSettings, elections: { ...dynamicSettings.elections, ...elections } };
}

describe('getImpliedElectionIds', () => {
  it('implies the only election', () => {
    expect(getImpliedElectionIds({ appSettings: settingsWith(), dataRoot: rootWith('regional') })).toEqual([
      'regional'
    ]);
  });

  it('implies nothing when there are several elections', () => {
    expect(
      getImpliedElectionIds({ appSettings: settingsWith(), dataRoot: rootWith('national', 'regional') })
    ).toBeUndefined();
  });

  it('implies every election when the settings disallow the selection', () => {
    expect(
      getImpliedElectionIds({
        appSettings: settingsWith({ disallowSelection: true }),
        dataRoot: rootWith('national', 'regional', 'municipal')
      })
    ).toEqual(['national', 'regional', 'municipal']);
  });

  it('considers only the elections held in the chosen constituencies', () => {
    const dataRoot = rootWith('national', 'regional', 'municipal');

    expect(
      getImpliedElectionIds({ appSettings: settingsWith(), dataRoot, selectedConstituencyIds: ['region-1'] })
    ).toEqual(['regional']);
    expect(
      getImpliedElectionIds({
        appSettings: settingsWith(),
        dataRoot,
        selectedConstituencyIds: ['region-1', 'municipality-1a']
      })
    ).toBeUndefined();
    expect(
      getImpliedElectionIds({
        appSettings: settingsWith({ disallowSelection: true }),
        dataRoot,
        selectedConstituencyIds: ['region-1', 'municipality-1a']
      })
    ).toEqual(['regional', 'municipal']);
  });

  it('considers every election when the list of chosen constituencies is empty', () => {
    expect(
      getImpliedElectionIds({
        appSettings: settingsWith(),
        dataRoot: rootWith('national', 'regional'),
        selectedConstituencyIds: []
      })
    ).toBeUndefined();
  });

  it('counts an election as held in the chosen constituencies when two of them match it', () => {
    const dataRoot = rootWith('national', 'mixed');
    const chosen = ['region-1', 'municipality-1a'];

    expect(() =>
      dataRoot.getElection('mixed').getApplicableConstituency(chosen.map((id) => dataRoot.getConstituency(id)))
    ).toThrow();
    expect(getImpliedElectionIds({ appSettings: settingsWith(), dataRoot, selectedConstituencyIds: chosen })).toEqual([
      'mixed'
    ]);
  });
});

describe('getImpliedConstituencyIds', () => {
  it('implies the one constituency of each chosen election', () => {
    expect(
      getImpliedConstituencyIds({ dataRoot: rootWith('national', 'regional'), selectedElectionIds: ['national'] })
    ).toEqual(['whole-country']);
  });

  it('implies nothing when a chosen election has several constituencies', () => {
    expect(
      getImpliedConstituencyIds({
        dataRoot: rootWith('national', 'regional'),
        selectedElectionIds: ['national', 'regional']
      })
    ).toBeUndefined();
  });

  it('implies nothing for an election with two constituency groups', () => {
    expect(
      getImpliedConstituencyIds({ dataRoot: rootWith('national', 'mixed'), selectedElectionIds: ['mixed'] })
    ).toBeUndefined();
  });

  it('considers every election when none is chosen', () => {
    expect(getImpliedConstituencyIds({ dataRoot: rootWith('national') })).toEqual(['whole-country']);
    expect(getImpliedConstituencyIds({ dataRoot: rootWith('national'), selectedElectionIds: [] })).toEqual([
      'whole-country'
    ]);
    expect(getImpliedConstituencyIds({ dataRoot: rootWith('national', 'regional') })).toBeUndefined();
  });
});
