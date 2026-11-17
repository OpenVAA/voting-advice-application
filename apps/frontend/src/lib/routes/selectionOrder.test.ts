import { dynamicSettings, staticSettings } from '@openvaa/app-shared';
import { DataRoot } from '@openvaa/data';
import { describe, expect, it } from 'vitest';
import {
  constituenciesStepOutcome,
  electionsHeldIn,
  electionsStepOutcome,
  mostSpecificConstituency,
  usesSingleConstituencyGroup
} from './selectionOrder';
import type { Constituency, Election, ElectionData } from '@openvaa/data';

/**
 * The elections a data root of these tests can hold. `national` and `presidential` share one constituency; `regional` and `municipal` have one group of several constituencies each; `mixed` has both of those groups, so that a region chosen together with one of its municipalities matches it twice; `paired` has two groups of the same size.
 */
const ELECTIONS = {
  national: { id: 'national', name: 'National', constituencyGroupIds: ['nation'] },
  presidential: { id: 'presidential', name: 'Presidential', constituencyGroupIds: ['nation'] },
  regional: { id: 'regional', name: 'Regional', constituencyGroupIds: ['regions'] },
  municipal: { id: 'municipal', name: 'Municipal', constituencyGroupIds: ['municipalities'] },
  mixed: { id: 'mixed', name: 'Mixed', constituencyGroupIds: ['regions', 'municipalities'] },
  paired: { id: 'paired', name: 'Paired', constituencyGroupIds: ['regions', 'districts'] }
} satisfies Record<string, ElectionData>;

type ElectionName = keyof typeof ELECTIONS;

/**
 * A data root that holds the named elections and every constituency group.
 */
function rootWith(...elections: Array<ElectionName>): DataRoot {
  const dataRoot = new DataRoot();
  dataRoot.provideElectionData(elections.map((id) => ELECTIONS[id]));
  dataRoot.provideConstituencyData({
    groups: [
      { id: 'nation', constituencyIds: ['whole-country'] },
      { id: 'regions', constituencyIds: ['region-1', 'region-2'] },
      { id: 'municipalities', constituencyIds: ['municipality-1a', 'municipality-1b', 'municipality-2a'] },
      { id: 'districts', constituencyIds: ['district-x', 'district-y'] }
    ],
    constituencies: [
      { id: 'whole-country', name: 'The whole country' },
      { id: 'region-1', name: 'Region 1' },
      { id: 'region-2', name: 'Region 2' },
      { id: 'municipality-1a', name: 'Municipality 1a', parentId: 'region-1' },
      { id: 'municipality-1b', name: 'Municipality 1b', parentId: 'region-1' },
      { id: 'municipality-2a', name: 'Municipality 2a', parentId: 'region-2' },
      { id: 'district-x', name: 'District X' },
      { id: 'district-y', name: 'District Y' }
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

/**
 * The named elections of a data root.
 */
function electionsOf(dataRoot: DataRoot, ...ids: Array<ElectionName>): Array<Election> {
  return ids.map((id) => dataRoot.getElection(id));
}

/**
 * The named constituencies of a data root.
 */
function constituenciesOf(dataRoot: DataRoot, ...ids: Array<string>): Array<Constituency> {
  return ids.map((id) => dataRoot.getConstituency(id));
}

/** The way the voter app asks: every election of the data root, with the setting that implies them all honoured. */
const VOTER = {
  honourDisallowSelection: true,
  implyWithinChosenConstituencies: false,
  skipWhenFullyImplied: false
} as const;

/** The way the contestant app asks, over the elections an entity may stand in. */
const CONTESTANT = {
  honourDisallowSelection: false,
  implyWithinChosenConstituencies: true,
  skipWhenFullyImplied: true
} as const;

const NO_GROUP_FIRST = settingsWith();
const REGIONS_FIRST = settingsWith({ startFromConstituencyGroup: 'regions' });
const MUNICIPALITIES_FIRST = settingsWith({ startFromConstituencyGroup: 'municipalities' });

describe('electionsStepOutcome, asked the way the voter app asks', () => {
  it('is done when a constituency group comes first, a constituency is chosen and the election is implied', () => {
    expect(
      electionsStepOutcome({
        ...VOTER,
        dataRoot: rootWith('regional'),
        appSettings: REGIONS_FIRST,
        constituencyIds: ['region-1']
      })
    ).toStrictEqual({ action: 'done', electionIds: ['regional'], constituencyIds: ['region-1'] });
  });

  it('is done with every election when a constituency is chosen and the settings disallow the selection', () => {
    expect(
      electionsStepOutcome({
        ...VOTER,
        dataRoot: rootWith('national', 'regional'),
        appSettings: settingsWith({ startFromConstituencyGroup: 'regions', disallowSelection: true }),
        constituencyIds: ['region-1']
      })
    ).toStrictEqual({ action: 'done', electionIds: ['national', 'regional'], constituencyIds: ['region-1'] });
  });

  it('shows the step when a constituency group comes first, a constituency is chosen and the election is not implied', () => {
    expect(
      electionsStepOutcome({
        ...VOTER,
        dataRoot: rootWith('national', 'regional'),
        appSettings: REGIONS_FIRST,
        constituencyIds: ['region-1']
      })
    ).toStrictEqual({ action: 'show' });
  });

  it.each([
    ['is implied', ['regional']],
    ['is not implied', ['national', 'regional']]
  ] as Array<[string, Array<ElectionName>]>)(
    'goes to the constituencies when a constituency group comes first and none is chosen, when the election %s',
    (_, elections) => {
      expect(
        electionsStepOutcome({ ...VOTER, dataRoot: rootWith(...elections), appSettings: REGIONS_FIRST })
      ).toStrictEqual({ action: 'goto', step: 'constituencies' });
    }
  );

  it.each([
    ['no constituency is chosen', undefined],
    ['a constituency is chosen', ['region-1']]
  ])('goes to the constituencies with the implied election when no group comes first and %s', (_, constituencyIds) => {
    expect(
      electionsStepOutcome({
        ...VOTER,
        dataRoot: rootWith('regional'),
        appSettings: NO_GROUP_FIRST,
        constituencyIds
      })
    ).toStrictEqual({ action: 'goto', step: 'constituencies', electionIds: ['regional'] });
  });

  it('goes to the constituencies with every election when no group comes first and the settings disallow the selection', () => {
    expect(
      electionsStepOutcome({
        ...VOTER,
        dataRoot: rootWith('national', 'regional'),
        appSettings: settingsWith({ disallowSelection: true })
      })
    ).toStrictEqual({ action: 'goto', step: 'constituencies', electionIds: ['national', 'regional'] });
  });

  it.each([
    ['no constituency is chosen', undefined],
    ['a constituency is chosen', ['region-1']]
  ])('shows the step when no group comes first, the election is not implied and %s', (_, constituencyIds) => {
    expect(
      electionsStepOutcome({
        ...VOTER,
        dataRoot: rootWith('national', 'regional'),
        appSettings: NO_GROUP_FIRST,
        constituencyIds
      })
    ).toStrictEqual({ action: 'show' });
  });
});

describe('constituenciesStepOutcome, asked the way the voter app asks', () => {
  it.each([
    ['the only election has one constituency', ['national'], undefined],
    ['an election is chosen', ['national', 'regional'], ['national']],
    ['no election is chosen or implied', ['national', 'regional'], undefined]
  ] as Array<[string, Array<ElectionName>, Array<string> | undefined]>)(
    'shows the step when a constituency group comes first, also when %s',
    (_, elections, electionIds) => {
      expect(
        constituenciesStepOutcome({
          ...VOTER,
          dataRoot: rootWith(...elections),
          appSettings: REGIONS_FIRST,
          electionIds
        })
      ).toStrictEqual({ action: 'show' });
    }
  );

  it('goes to the elections when no group comes first and no election is chosen or implied', () => {
    expect(
      constituenciesStepOutcome({
        ...VOTER,
        dataRoot: rootWith('national', 'regional'),
        appSettings: NO_GROUP_FIRST
      })
    ).toStrictEqual({ action: 'goto', step: 'elections' });
  });

  it('is done when no group comes first and the chosen election has one constituency', () => {
    expect(
      constituenciesStepOutcome({
        ...VOTER,
        dataRoot: rootWith('national', 'regional'),
        appSettings: NO_GROUP_FIRST,
        electionIds: ['national']
      })
    ).toStrictEqual({ action: 'done', electionIds: ['national'], constituencyIds: ['whole-country'] });
  });

  it('is done when no group comes first and the implied election has one constituency', () => {
    expect(
      constituenciesStepOutcome({ ...VOTER, dataRoot: rootWith('national'), appSettings: NO_GROUP_FIRST })
    ).toStrictEqual({ action: 'done', electionIds: ['national'], constituencyIds: ['whole-country'] });
  });

  it('is done with every election when the settings disallow the selection and each has one constituency', () => {
    expect(
      constituenciesStepOutcome({
        ...VOTER,
        dataRoot: rootWith('national', 'presidential'),
        appSettings: settingsWith({ disallowSelection: true })
      })
    ).toStrictEqual({
      action: 'done',
      electionIds: ['national', 'presidential'],
      constituencyIds: ['whole-country']
    });
  });

  it.each([
    ['the chosen election has several constituencies', ['national', 'regional'], ['regional']],
    ['one of the chosen elections has several constituencies', ['national', 'regional'], ['national', 'regional']],
    ['the implied election has several constituencies', ['regional'], undefined]
  ] as Array<[string, Array<ElectionName>, Array<string> | undefined]>)(
    'shows the step when no group comes first and %s',
    (_, elections, electionIds) => {
      expect(
        constituenciesStepOutcome({
          ...VOTER,
          dataRoot: rootWith(...elections),
          appSettings: NO_GROUP_FIRST,
          electionIds
        })
      ).toStrictEqual({ action: 'show' });
    }
  );
});

describe('the two outcomes, asked the way the contestant app asks', () => {
  const dataRoot = rootWith('national', 'presidential', 'regional', 'municipal', 'mixed');

  it.each([
    ['no group comes first', NO_GROUP_FIRST],
    ['a constituency group comes first', REGIONS_FIRST]
  ])('are done at once for one election with one constituency, when %s', (_, appSettings) => {
    const input = { ...CONTESTANT, dataRoot, appSettings, elections: electionsOf(dataRoot, 'national') };
    const done = { action: 'done', electionIds: ['national'], constituencyIds: ['whole-country'] };

    expect(electionsStepOutcome(input)).toStrictEqual(done);
    expect(constituenciesStepOutcome(input)).toStrictEqual(done);
    expect(electionsStepOutcome({ ...input, constituencyIds: ['region-1'] })).toStrictEqual(done);
  });

  it('lead one election with several constituencies past the election step to the constituency step', () => {
    const input = {
      ...CONTESTANT,
      dataRoot,
      appSettings: NO_GROUP_FIRST,
      elections: electionsOf(dataRoot, 'regional')
    };

    expect(electionsStepOutcome(input)).toStrictEqual({
      action: 'goto',
      step: 'constituencies',
      electionIds: ['regional']
    });
    expect(constituenciesStepOutcome(input)).toStrictEqual({ action: 'show' });
    expect(constituenciesStepOutcome({ ...input, electionIds: ['regional'] })).toStrictEqual({ action: 'show' });
  });

  it('show the election step for several elections', () => {
    const input = {
      ...CONTESTANT,
      dataRoot,
      appSettings: NO_GROUP_FIRST,
      elections: electionsOf(dataRoot, 'national', 'regional')
    };

    expect(electionsStepOutcome(input)).toStrictEqual({ action: 'show' });
    expect(constituenciesStepOutcome(input)).toStrictEqual({ action: 'goto', step: 'elections' });
  });

  it('are done at the constituencies address when each of several chosen elections has one constituency', () => {
    expect(
      constituenciesStepOutcome({
        ...CONTESTANT,
        dataRoot,
        appSettings: NO_GROUP_FIRST,
        elections: electionsOf(dataRoot, 'national', 'presidential', 'regional'),
        electionIds: ['presidential', 'national']
      })
    ).toStrictEqual({
      action: 'done',
      electionIds: ['presidential', 'national'],
      constituencyIds: ['whole-country']
    });
  });

  it('show the constituency step when one of several chosen elections has several constituencies', () => {
    expect(
      constituenciesStepOutcome({
        ...CONTESTANT,
        dataRoot,
        appSettings: NO_GROUP_FIRST,
        elections: electionsOf(dataRoot, 'national', 'presidential', 'regional'),
        electionIds: ['national', 'regional']
      })
    ).toStrictEqual({ action: 'show' });
  });

  it('do not imply several elections when the settings disallow the selection', () => {
    const input = {
      dataRoot,
      appSettings: settingsWith({ disallowSelection: true }),
      elections: electionsOf(dataRoot, 'national', 'regional')
    };

    expect(electionsStepOutcome({ ...CONTESTANT, ...input })).toStrictEqual({ action: 'show' });
    expect(constituenciesStepOutcome({ ...CONTESTANT, ...input })).toStrictEqual({ action: 'goto', step: 'elections' });
    expect(electionsStepOutcome({ ...CONTESTANT, ...input, honourDisallowSelection: true })).toStrictEqual({
      action: 'goto',
      step: 'constituencies',
      electionIds: ['national', 'regional']
    });
  });
});

describe('the two outcomes, asked the way the contestant app asks while a constituency group comes first', () => {
  const dataRoot = rootWith('national', 'regional', 'municipal', 'mixed');

  it('go to the constituency step while no constituency is chosen', () => {
    const input = {
      ...CONTESTANT,
      dataRoot,
      appSettings: MUNICIPALITIES_FIRST,
      elections: electionsOf(dataRoot, 'regional', 'municipal')
    };

    expect(electionsStepOutcome(input)).toStrictEqual({ action: 'goto', step: 'constituencies' });
    expect(constituenciesStepOutcome(input)).toStrictEqual({ action: 'show' });
  });

  it('lead one election with several constituencies to the constituency step alone', () => {
    const input = {
      ...CONTESTANT,
      dataRoot,
      appSettings: MUNICIPALITIES_FIRST,
      elections: electionsOf(dataRoot, 'municipal')
    };

    expect(electionsStepOutcome(input)).toStrictEqual({ action: 'goto', step: 'constituencies' });
    expect(constituenciesStepOutcome(input)).toStrictEqual({ action: 'show' });
    expect(electionsStepOutcome({ ...input, constituencyIds: ['municipality-1a'] })).toStrictEqual({
      action: 'done',
      electionIds: ['municipal'],
      constituencyIds: ['municipality-1a']
    });
  });

  it('are done without an election step when one election on offer is held in the chosen constituency', () => {
    expect(
      electionsStepOutcome({
        ...CONTESTANT,
        dataRoot,
        appSettings: MUNICIPALITIES_FIRST,
        elections: electionsOf(dataRoot, 'regional', 'municipal'),
        constituencyIds: ['municipality-1a']
      })
    ).toStrictEqual({ action: 'done', electionIds: ['municipal'], constituencyIds: ['municipality-1a'] });
  });

  it('show the election step when several elections on offer are held in the chosen constituency', () => {
    expect(
      electionsStepOutcome({
        ...CONTESTANT,
        dataRoot,
        appSettings: MUNICIPALITIES_FIRST,
        elections: electionsOf(dataRoot, 'regional', 'municipal', 'mixed'),
        constituencyIds: ['municipality-1a']
      })
    ).toStrictEqual({ action: 'show' });
  });

  it('count an election the chosen constituencies match twice as held there', () => {
    expect(
      electionsStepOutcome({
        ...CONTESTANT,
        dataRoot,
        appSettings: MUNICIPALITIES_FIRST,
        elections: electionsOf(dataRoot, 'national', 'mixed'),
        constituencyIds: ['municipality-1a', 'region-1']
      })
    ).toStrictEqual({
      action: 'done',
      electionIds: ['mixed'],
      constituencyIds: ['municipality-1a', 'region-1']
    });
  });

  it('show the step asked for when no election on offer is held in the chosen constituency', () => {
    const elections = electionsOf(dataRoot, 'regional');
    const input = {
      ...CONTESTANT,
      dataRoot,
      appSettings: MUNICIPALITIES_FIRST,
      elections,
      constituencyIds: ['municipality-1a']
    };

    expect(constituenciesStepOutcome(input)).toStrictEqual({ action: 'show' });
    expect(electionsStepOutcome(input)).toStrictEqual({ action: 'show' });
    expect(electionsHeldIn({ elections, constituencies: constituenciesOf(dataRoot, 'municipality-1a') })).toEqual([]);
  });
});

describe('the ids of an outcome', () => {
  const dataRoot = rootWith('national', 'presidential', 'regional', 'municipal');

  it('never hold a chosen election that is not on offer', () => {
    const input = {
      ...CONTESTANT,
      dataRoot,
      appSettings: NO_GROUP_FIRST,
      elections: electionsOf(dataRoot, 'national', 'regional')
    };

    expect(constituenciesStepOutcome({ ...input, electionIds: ['presidential', 'national'] })).toStrictEqual({
      action: 'done',
      electionIds: ['national'],
      constituencyIds: ['whole-country']
    });
    expect(constituenciesStepOutcome({ ...input, electionIds: ['presidential'] })).toStrictEqual({
      action: 'goto',
      step: 'elections'
    });
  });

  it('never hold an implied election that is not on offer', () => {
    const elections = electionsOf(dataRoot, 'regional');

    expect(electionsStepOutcome({ ...CONTESTANT, dataRoot, appSettings: NO_GROUP_FIRST, elections })).toStrictEqual({
      action: 'goto',
      step: 'constituencies',
      electionIds: ['regional']
    });
    expect(
      electionsStepOutcome({
        ...VOTER,
        dataRoot,
        appSettings: settingsWith({ disallowSelection: true }),
        elections: electionsOf(dataRoot, 'national', 'regional')
      })
    ).toStrictEqual({ action: 'goto', step: 'constituencies', electionIds: ['national', 'regional'] });
  });

  it.each([
    ['an empty list', []],
    ['an election the data root does not hold', ['no-such-election']]
  ])('take %s as no chosen election', (_, electionIds) => {
    expect(constituenciesStepOutcome({ ...VOTER, dataRoot, appSettings: NO_GROUP_FIRST, electionIds })).toStrictEqual({
      action: 'goto',
      step: 'elections'
    });
  });

  it.each([
    ['an empty list', []],
    ['a constituency the data root does not hold', ['no-such-constituency']]
  ])('take %s as no chosen constituency', (_, constituencyIds) => {
    const input = { dataRoot: rootWith('regional'), appSettings: REGIONS_FIRST, constituencyIds };

    expect(electionsStepOutcome({ ...VOTER, ...input })).toStrictEqual({ action: 'goto', step: 'constituencies' });
    expect(electionsStepOutcome({ ...CONTESTANT, ...input })).toStrictEqual({
      action: 'goto',
      step: 'constituencies'
    });
  });

  it('name a chosen constituency the data root holds and leave out one it does not', () => {
    expect(
      electionsStepOutcome({
        ...VOTER,
        dataRoot: rootWith('regional'),
        appSettings: REGIONS_FIRST,
        constituencyIds: ['no-such-constituency', 'region-2']
      })
    ).toStrictEqual({ action: 'done', electionIds: ['regional'], constituencyIds: ['region-2'] });
  });
});

describe('electionsHeldIn', () => {
  const dataRoot = rootWith('national', 'regional', 'municipal', 'mixed');

  it('answers the elections with a constituency among those given', () => {
    expect(
      electionsHeldIn({ elections: dataRoot.elections, constituencies: constituenciesOf(dataRoot, 'region-1') }).map(
        (e) => e.id
      )
    ).toEqual(['regional', 'mixed']);
  });

  it('counts an election that two of the constituencies match as held', () => {
    const constituencies = constituenciesOf(dataRoot, 'region-1', 'municipality-1a');

    expect(() => dataRoot.getElection('mixed').getApplicableConstituency(constituencies)).toThrow();
    expect(electionsHeldIn({ elections: dataRoot.elections, constituencies }).map((e) => e.id)).toEqual([
      'regional',
      'municipal',
      'mixed'
    ]);
  });

  it('answers only elections among those given', () => {
    expect(
      electionsHeldIn({
        elections: electionsOf(dataRoot, 'national', 'mixed'),
        constituencies: constituenciesOf(dataRoot, 'region-1')
      }).map((e) => e.id)
    ).toEqual(['mixed']);
  });

  it('answers none when no constituency is given', () => {
    expect(electionsHeldIn({ elections: dataRoot.elections, constituencies: [] })).toEqual([]);
  });
});

describe('usesSingleConstituencyGroup', () => {
  const dataRoot = rootWith('regional');

  it('answers the group the settings name', () => {
    expect(
      usesSingleConstituencyGroup({ appSettings: REGIONS_FIRST, constituencyGroups: dataRoot.constituencyGroups })
    ).toBe(dataRoot.getConstituencyGroup('regions'));
  });

  it('answers nothing when the settings name no group', () => {
    expect(
      usesSingleConstituencyGroup({ appSettings: NO_GROUP_FIRST, constituencyGroups: dataRoot.constituencyGroups })
    ).toBeUndefined();
  });

  it('answers nothing, and does not throw, while the group the settings name is not among those given', () => {
    expect(usesSingleConstituencyGroup({ appSettings: REGIONS_FIRST, constituencyGroups: [] })).toBeUndefined();
    expect(
      usesSingleConstituencyGroup({
        appSettings: REGIONS_FIRST,
        constituencyGroups: new DataRoot().constituencyGroups
      })
    ).toBeUndefined();
  });
});

describe('mostSpecificConstituency', () => {
  const dataRoot = rootWith('regional', 'mixed', 'paired');

  it('answers the one constituency of the election among those given', () => {
    expect(
      mostSpecificConstituency({
        election: dataRoot.getElection('regional'),
        constituencies: constituenciesOf(dataRoot, 'municipality-1a', 'region-2')
      })?.id
    ).toBe('region-2');
  });

  it.each([
    ['first', ['region-1', 'municipality-1a']],
    ['last', ['municipality-1a', 'region-1']]
  ])('answers the constituency of the group with the fewest constituencies, given %s', (_, ids) => {
    expect(
      mostSpecificConstituency({
        election: dataRoot.getElection('mixed'),
        constituencies: constituenciesOf(dataRoot, ...ids)
      })?.id
    ).toBe('region-1');
  });

  it.each([
    [['district-x', 'region-1'], 'district-x'],
    [['region-1', 'district-x'], 'region-1'],
    [['region-2', 'region-1'], 'region-2']
  ])('answers the first of %j, whose groups are of one size', (ids, first) => {
    expect(
      mostSpecificConstituency({
        election: dataRoot.getElection('paired'),
        constituencies: constituenciesOf(dataRoot, ...ids)
      })?.id
    ).toBe(first);
  });

  it('answers nothing when the election has none of the constituencies given', () => {
    expect(
      mostSpecificConstituency({
        election: dataRoot.getElection('regional'),
        constituencies: constituenciesOf(dataRoot, 'municipality-1a', 'whole-country')
      })
    ).toBeUndefined();
    expect(
      mostSpecificConstituency({ election: dataRoot.getElection('regional'), constituencies: [] })
    ).toBeUndefined();
  });
});
