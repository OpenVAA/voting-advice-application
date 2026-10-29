/**
 * The page loads of the nomination editor's three steps, each as an address that is served or forwarded, and the two functions that say where a step's Continue leads.
 *
 * Each load is the REAL one, driven with a fake event: `parent` resolves the parent loads' data with the root load's elections and constituencies, the entity's nominations and the facts of them, and `url` is the address asked for. A served address resolves the load's data; a forwarded one rejects with a redirect whose target is read back as a path and a selection.
 */

import { dynamicSettings, staticSettings } from '@openvaa/app-shared';
import { DataRoot } from '@openvaa/data';
import { describe, expect, it } from 'vitest';
import { load as constituenciesLoad } from './constituencies/+page';
import { load as detailsLoad } from './details/+page';
import { load as electionsLoad } from './elections/+page';
import {
  afterConstituencies,
  afterElections,
  constituenciesStoodFor,
  hasSelectionStep,
  selectionOfAddress
} from './stepSelection';
import type { ElectionData } from '@openvaa/data';
import type { NominationSelection, StepFacts } from './stepSelection';

const ENTITY_ID = '11111111-1111-4111-8111-111111111111';
const ENTITY_PARAMS = { entityType: 'candidate', entityId: ENTITY_ID };
const EDITOR = `/contestant/candidate/${ENTITY_ID}/nominations`;

/**
 * The elections a case can hold. `national` and `presidential` have one constituency, the whole country; `regional` and `county` share a group of two regions; `municipal` has a group of three municipalities, each inside a region.
 */
const ELECTIONS = {
  national: { id: 'national', name: 'National', constituencyGroupIds: ['nation'] },
  presidential: { id: 'presidential', name: 'Presidential', constituencyGroupIds: ['nation'] },
  regional: { id: 'regional', name: 'Regional', constituencyGroupIds: ['regions'] },
  county: { id: 'county', name: 'County', constituencyGroupIds: ['regions'] },
  municipal: { id: 'municipal', name: 'Municipal', constituencyGroupIds: ['municipalities'] }
} satisfies Record<string, ElectionData>;

type ElectionName = keyof typeof ELECTIONS;

const CONSTITUENCY_DATA = {
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
};

/** A nomination of the entity, as a case states it: where it stands. */
type StoredNomination = { electionId: ElectionName; constituencyId: string };

/** What a case states of the application: the elections it holds, those of them that admit the entity's type, the constituency group that is chosen first, if any, the entity's nominations in the editor's reach, and those it holds outside it. */
type World = {
  elections: Array<ElectionName>;
  admissible?: Array<ElectionName>;
  startFromConstituencyGroup?: string;
  nominations?: Array<StoredNomination>;
  outOfReach?: Array<StoredNomination>;
};

/** The data of a step's parent loads for an ungated user, in the world given. The entity's nominations are listed with those outside the editor's reach first, and the facts name the others. */
function parentDataOf({
  elections,
  admissible = elections,
  startFromConstituencyGroup,
  nominations = [],
  outOfReach = []
}: World): Record<string, unknown> {
  const inReach = nominations.map((nomination, index) => ({ id: `nomination-${index}`, ...nomination }));
  const others = outOfReach.map((nomination, index) => ({ id: `other-nomination-${index}`, ...nomination }));
  return {
    gate: null,
    nominationFacts: {
      editable: true,
      admissibleElectionIds: admissible,
      inReachNominationIds: inReach.map((nomination) => nomination.id)
    },
    contestantUserData: { nominations: [...others, ...inReach] },
    appSettingsData: { elections: { startFromConstituencyGroup } },
    electionData: elections.map((id) => ELECTIONS[id]),
    constituencyData: CONSTITUENCY_DATA
  };
}

/** What the constituency step's load answers beside the selection, for an entity with no nomination. */
function nothingKept(toChoose: Array<string>, onArrival: Record<string, string> = {}) {
  return { toChoose, kept: [], onArrival };
}

type StepLoad = typeof electionsLoad | typeof constituenciesLoad | typeof detailsLoad;

/** An event for the address `step` + `search` under the entity, below the parent data given. It is typed as the event of the load it is handed to. */
function eventOf<TEvent>(step: string, search: string, parentData: Record<string, unknown>): TEvent {
  return {
    params: ENTITY_PARAMS,
    parent: async () => parentData,
    url: new URL(`http://localhost${EDITOR}/${step}${search}`)
  } as unknown as TEvent;
}

/** Where a load forwards to: the step its target names and the selection the target carries. `undefined` when the load forwards nowhere. */
async function forwardOf(run: Promise<unknown>): Promise<{ step: string; selection: NominationSelection } | undefined> {
  const thrown = await run.then(
    () => undefined,
    (e: unknown) => e
  );
  if (thrown === undefined) return undefined;
  expect(thrown).toMatchObject({ status: 307 });
  const target = new URL((thrown as { location: string }).location, 'http://localhost');
  expect(
    target.pathname.startsWith(`${EDITOR}/`),
    `the target ${target.pathname} is a step of the entity's editor`
  ).toBe(true);
  const selection = selectionOfAddress(target);
  return {
    step: target.pathname.slice(EDITOR.length + 1),
    selection: {
      electionIds: [...selection.electionIds].sort(),
      constituencyIds: [...selection.constituencyIds].sort()
    }
  };
}

/** The search of an address that names the elections and constituencies given, each param repeated. */
function searchOf({
  elections = [],
  constituencies = []
}: {
  elections?: Array<string>;
  constituencies?: Array<string>;
}): string {
  const search = new URLSearchParams();
  for (const id of elections) search.append('nominationElectionId', id);
  for (const id of constituencies) search.append('nominationConstituencyId', id);
  const query = search.toString();
  return query ? `?${query}` : '';
}

describe("the address of the election step, which is the editor's entry", () => {
  it('forwards to the details step with the pair when one election is admissible and it has one constituency', async () => {
    const run = electionsLoad(eventOf('elections', '', parentDataOf({ elections: ['national'] })));
    expect(await forwardOf(run)).toEqual({
      step: 'details',
      selection: { electionIds: ['national'], constituencyIds: ['whole-country'] }
    });
  });

  it('forwards to the constituency step with the election when one election is admissible and it has several constituencies', async () => {
    const run = electionsLoad(eventOf('elections', '', parentDataOf({ elections: ['regional'] })));
    expect(await forwardOf(run)).toEqual({
      step: 'constituencies',
      selection: { electionIds: ['regional'], constituencyIds: [] }
    });
  });

  it('counts the admissible elections alone: one admissible election among several is not shown as a choice', async () => {
    const world: World = { elections: ['national', 'regional', 'presidential'], admissible: ['regional'] };
    const run = electionsLoad(eventOf('elections', '', parentDataOf(world)));
    expect(await forwardOf(run)).toEqual({
      step: 'constituencies',
      selection: { electionIds: ['regional'], constituencyIds: [] }
    });
  });

  it('is served when several elections are admissible, with nothing chosen for an address that names nothing', async () => {
    const result = await electionsLoad(eventOf('elections', '', parentDataOf({ elections: ['national', 'regional'] })));
    expect(result).toEqual({ nominationSelection: { electionIds: [], constituencyIds: [] } });
  });

  it('is served with the elections and constituencies its address names, in either form of a repeated param', async () => {
    const world: World = { elections: ['national', 'regional'] };
    const repeated = await electionsLoad(
      eventOf(
        'elections',
        searchOf({ elections: ['regional', 'national'], constituencies: ['region-2'] }),
        parentDataOf(world)
      )
    );
    const indexed = await electionsLoad(
      eventOf(
        'elections',
        '?nominationElectionId[0]=regional&nominationElectionId[1]=national&nominationConstituencyId=region-2',
        parentDataOf(world)
      )
    );
    const expected = { nominationSelection: { electionIds: ['regional', 'national'], constituencyIds: ['region-2'] } };
    expect(repeated).toEqual(expected);
    expect(indexed).toEqual(expected);
  });

  it('forwards to the constituency step while a constituency group is chosen first and no constituency is chosen', async () => {
    const world: World = { elections: ['national', 'regional'], startFromConstituencyGroup: 'regions' };
    const run = electionsLoad(eventOf('elections', '', parentDataOf(world)));
    expect(await forwardOf(run)).toEqual({
      step: 'constituencies',
      selection: { electionIds: [], constituencyIds: [] }
    });
  });

  it('forwards to the details step when a constituency is chosen first and one admissible election is held there', async () => {
    const world: World = { elections: ['national', 'regional'], startFromConstituencyGroup: 'regions' };
    const run = electionsLoad(eventOf('elections', searchOf({ constituencies: ['region-1'] }), parentDataOf(world)));
    expect(await forwardOf(run)).toEqual({
      step: 'details',
      selection: { electionIds: ['regional'], constituencyIds: ['region-1'] }
    });
  });

  it('is served when a constituency is chosen first and several admissible elections are held there', async () => {
    const world: World = { elections: ['regional', 'municipal'], startFromConstituencyGroup: 'municipalities' };
    const result = await electionsLoad(
      eventOf('elections', searchOf({ constituencies: ['municipality-1a', 'region-1'] }), parentDataOf(world))
    );
    expect(result).toEqual({
      nominationSelection: { electionIds: [], constituencyIds: ['municipality-1a', 'region-1'] }
    });
  });

  it('skips both steps for one election with one constituency also while a constituency group is chosen first', async () => {
    const world: World = { elections: ['national'], startFromConstituencyGroup: 'regions' };
    const run = electionsLoad(eventOf('elections', '', parentDataOf(world)));
    expect(await forwardOf(run)).toEqual({
      step: 'details',
      selection: { electionIds: ['national'], constituencyIds: ['whole-country'] }
    });
  });
});

describe('the address of the election step, for an entity that has nominations', () => {
  const WORLD: World = {
    elections: ['national', 'regional', 'municipal'],
    nominations: [
      { electionId: 'regional', constituencyId: 'region-2' },
      { electionId: 'national', constituencyId: 'whole-country' }
    ],
    outOfReach: [{ electionId: 'municipal', constituencyId: 'municipality-1a' }]
  };

  it('is served with the elections of the nominations in reach as chosen when its address names no election', async () => {
    const result = await electionsLoad(eventOf('elections', '', parentDataOf(WORLD)));
    expect(result).toEqual({ nominationSelection: { electionIds: ['regional', 'national'], constituencyIds: [] } });
  });

  it('is served with an election in which the entity holds several nominations as chosen once', async () => {
    const world: World = {
      ...WORLD,
      nominations: [...(WORLD.nominations ?? []), { electionId: 'regional', constituencyId: 'region-1' }]
    };
    const result = await electionsLoad(eventOf('elections', '', parentDataOf(world)));
    expect(result).toEqual({ nominationSelection: { electionIds: ['regional', 'national'], constituencyIds: [] } });
  });

  it('is served with the elections its address names, whatever the entity is nominated in', async () => {
    const result = await electionsLoad(
      eventOf(
        'elections',
        searchOf({ elections: ['municipal'], constituencies: ['municipality-2a'] }),
        parentDataOf(WORLD)
      )
    );
    expect(result).toEqual({
      nominationSelection: { electionIds: ['municipal'], constituencyIds: ['municipality-2a'] }
    });
  });

  it('is served with the elections of the nominations as chosen and the constituencies of its address, when a constituency was chosen first', async () => {
    const world: World = {
      elections: ['regional', 'municipal'],
      startFromConstituencyGroup: 'municipalities',
      nominations: [{ electionId: 'regional', constituencyId: 'region-1' }]
    };
    const result = await electionsLoad(
      eventOf('elections', searchOf({ constituencies: ['municipality-1a', 'region-1'] }), parentDataOf(world))
    );
    expect(result).toEqual({
      nominationSelection: { electionIds: ['regional'], constituencyIds: ['municipality-1a', 'region-1'] }
    });
  });

  it('still forwards to the constituency step for one admissible election with several constituencies', async () => {
    const world: World = {
      elections: ['regional'],
      nominations: [{ electionId: 'regional', constituencyId: 'region-2' }]
    };
    expect(await forwardOf(electionsLoad(eventOf('elections', '', parentDataOf(world))))).toEqual({
      step: 'constituencies',
      selection: { electionIds: ['regional'], constituencyIds: [] }
    });
  });
});

describe('the address of the constituency step', () => {
  it('is served when a chosen election has several constituencies', async () => {
    const result = await constituenciesLoad(
      eventOf(
        'constituencies',
        searchOf({ elections: ['regional', 'national'] }),
        parentDataOf({ elections: ['national', 'regional'] })
      )
    );
    expect(result).toEqual({
      nominationSelection: { electionIds: ['regional', 'national'], constituencyIds: [] },
      nominationConstituencyChoice: nothingKept(['regional'])
    });
  });

  it('is served for the one admissible election, which is implied, when it has several constituencies', async () => {
    const result = await constituenciesLoad(eventOf('constituencies', '', parentDataOf({ elections: ['regional'] })));
    expect(result).toEqual({
      nominationSelection: { electionIds: ['regional'], constituencyIds: [] },
      nominationConstituencyChoice: nothingKept(['regional'])
    });
  });

  it('forwards to the details step with each pair when every chosen election has one constituency', async () => {
    const world: World = { elections: ['national', 'regional', 'presidential'] };
    const run = constituenciesLoad(
      eventOf('constituencies', searchOf({ elections: ['presidential', 'national'] }), parentDataOf(world))
    );
    expect(await forwardOf(run)).toEqual({
      step: 'details',
      selection: { electionIds: ['national', 'presidential'], constituencyIds: ['whole-country'] }
    });
  });

  it('forwards to the entry when several elections are admissible and none is chosen', async () => {
    const run = constituenciesLoad(
      eventOf('constituencies', '', parentDataOf({ elections: ['national', 'regional'] }))
    );
    expect(await forwardOf(run)).toEqual({ step: 'elections', selection: { electionIds: [], constituencyIds: [] } });
  });

  it('forwards to the details step with the pair when one election is admissible and it has one constituency', async () => {
    const run = constituenciesLoad(eventOf('constituencies', '', parentDataOf({ elections: ['presidential'] })));
    expect(await forwardOf(run)).toEqual({
      step: 'details',
      selection: { electionIds: ['presidential'], constituencyIds: ['whole-country'] }
    });
  });

  it('is served while a constituency group is chosen first, whatever is chosen', async () => {
    const world: World = { elections: ['national', 'regional'], startFromConstituencyGroup: 'regions' };
    expect(await constituenciesLoad(eventOf('constituencies', '', parentDataOf(world)))).toEqual({
      nominationSelection: { electionIds: [], constituencyIds: [] },
      nominationConstituencyChoice: nothingKept(['national', 'regional'])
    });
    expect(
      await constituenciesLoad(
        eventOf(
          'constituencies',
          searchOf({ elections: ['regional'], constituencies: ['region-2'] }),
          parentDataOf(world)
        )
      )
    ).toEqual({
      nominationSelection: { electionIds: ['regional'], constituencyIds: ['region-2'] },
      nominationConstituencyChoice: nothingKept(['national', 'regional'], { regional: 'region-2' })
    });
  });
});

describe('the address of the constituency step, for an entity that has nominations', () => {
  const BOTH = searchOf({ elections: ['regional', 'national'] });

  it("is served with the constituency of the entity's one nomination to select on arrival, when its address names none", async () => {
    const world: World = {
      elections: ['national', 'regional'],
      nominations: [
        { electionId: 'regional', constituencyId: 'region-2' },
        { electionId: 'national', constituencyId: 'whole-country' }
      ]
    };
    expect(await constituenciesLoad(eventOf('constituencies', BOTH, parentDataOf(world)))).toEqual({
      nominationSelection: { electionIds: ['regional', 'national'], constituencyIds: [] },
      nominationConstituencyChoice: { toChoose: ['regional'], kept: [], onArrival: { regional: 'region-2' } }
    });
  });

  it('selects the constituency its address names in place of the stored one', async () => {
    const world: World = {
      elections: ['national', 'regional'],
      nominations: [{ electionId: 'regional', constituencyId: 'region-2' }]
    };
    const result = await constituenciesLoad(
      eventOf(
        'constituencies',
        searchOf({ elections: ['regional', 'national'], constituencies: ['region-1'] }),
        parentDataOf(world)
      )
    );
    expect(result).toEqual({
      nominationSelection: { electionIds: ['regional', 'national'], constituencyIds: ['region-1'] },
      nominationConstituencyChoice: { toChoose: ['regional'], kept: [], onArrival: { regional: 'region-1' } }
    });
  });

  it('selects the stored constituency of each election, also where two elections share their constituencies', async () => {
    const world: World = {
      elections: ['regional', 'county'],
      nominations: [
        { electionId: 'regional', constituencyId: 'region-2' },
        { electionId: 'county', constituencyId: 'region-1' }
      ]
    };
    const result = await constituenciesLoad(
      eventOf('constituencies', searchOf({ elections: ['regional', 'county'] }), parentDataOf(world))
    );
    expect(result).toEqual({
      nominationSelection: { electionIds: ['regional', 'county'], constituencyIds: [] },
      nominationConstituencyChoice: {
        toChoose: ['regional', 'county'],
        kept: [],
        onArrival: { regional: 'region-2', county: 'region-1' }
      }
    });
  });

  it('reads no nomination outside the reach the facts state', async () => {
    const world: World = {
      elections: ['national', 'regional'],
      outOfReach: [
        { electionId: 'regional', constituencyId: 'region-1' },
        { electionId: 'regional', constituencyId: 'region-2' }
      ]
    };
    expect(await constituenciesLoad(eventOf('constituencies', BOTH, parentDataOf(world)))).toEqual({
      nominationSelection: { electionIds: ['regional', 'national'], constituencyIds: [] },
      nominationConstituencyChoice: nothingKept(['regional'])
    });
  });

  it('is served for the one admissible election, with the stored constituency to select, when the address names nothing', async () => {
    const world: World = {
      elections: ['regional'],
      nominations: [{ electionId: 'regional', constituencyId: 'region-1' }]
    };
    expect(await constituenciesLoad(eventOf('constituencies', '', parentDataOf(world)))).toEqual({
      nominationSelection: { electionIds: ['regional'], constituencyIds: [] },
      nominationConstituencyChoice: { toChoose: ['regional'], kept: [], onArrival: { regional: 'region-1' } }
    });
  });

  it('is served with an election in which the entity holds several nominations as kept, beside one left to choose', async () => {
    const world: World = {
      elections: ['national', 'regional', 'municipal'],
      nominations: [
        { electionId: 'regional', constituencyId: 'region-1' },
        { electionId: 'regional', constituencyId: 'region-2' }
      ]
    };
    const result = await constituenciesLoad(
      eventOf('constituencies', searchOf({ elections: ['municipal', 'regional', 'national'] }), parentDataOf(world))
    );
    expect(result).toEqual({
      nominationSelection: { electionIds: ['municipal', 'regional', 'national'], constituencyIds: [] },
      nominationConstituencyChoice: { toChoose: ['municipal'], kept: ['regional'], onArrival: {} }
    });
  });

  it('forwards to the details step with every chosen election when each of them is kept or has one constituency', async () => {
    const world: World = {
      elections: ['national', 'regional'],
      nominations: [
        { electionId: 'regional', constituencyId: 'region-1' },
        { electionId: 'regional', constituencyId: 'region-2' }
      ]
    };
    expect(await forwardOf(constituenciesLoad(eventOf('constituencies', BOTH, parentDataOf(world))))).toEqual({
      step: 'details',
      selection: { electionIds: ['national', 'regional'], constituencyIds: ['whole-country'] }
    });
    expect(
      await forwardOf(
        constituenciesLoad(eventOf('constituencies', searchOf({ elections: ['regional'] }), parentDataOf(world)))
      )
    ).toEqual({ step: 'details', selection: { electionIds: ['regional'], constituencyIds: [] } });
  });

  it('forwards to the details step for the one admissible election when the entity holds several nominations in it', async () => {
    const world: World = {
      elections: ['regional'],
      nominations: [
        { electionId: 'regional', constituencyId: 'region-1' },
        { electionId: 'regional', constituencyId: 'region-2' }
      ]
    };
    expect(await forwardOf(constituenciesLoad(eventOf('constituencies', '', parentDataOf(world))))).toEqual({
      step: 'details',
      selection: { electionIds: ['regional'], constituencyIds: [] }
    });
  });

  it('while a constituency group is chosen first, is served with one choice for every admissible election and keeps none', async () => {
    const world: World = {
      elections: ['regional', 'municipal'],
      startFromConstituencyGroup: 'municipalities',
      nominations: [
        { electionId: 'regional', constituencyId: 'region-1' },
        { electionId: 'regional', constituencyId: 'region-2' },
        { electionId: 'municipal', constituencyId: 'municipality-2a' }
      ]
    };
    expect(await constituenciesLoad(eventOf('constituencies', '', parentDataOf(world)))).toEqual({
      nominationSelection: { electionIds: [], constituencyIds: [] },
      nominationConstituencyChoice: {
        toChoose: ['regional', 'municipal'],
        kept: [],
        onArrival: { municipal: 'municipality-2a' }
      }
    });
  });
});

describe('the address of the details step', () => {
  it('is served with one contest for each chosen election, in the order of the elections and not of the address', async () => {
    const world: World = { elections: ['national', 'regional', 'presidential'] };
    const result = await detailsLoad(
      eventOf(
        'details',
        searchOf({ elections: ['presidential', 'regional', 'national'], constituencies: ['region-2'] }),
        parentDataOf(world)
      )
    );
    expect(result).toEqual({
      nominationContests: [
        { electionId: 'national', constituencyId: 'whole-country' },
        { electionId: 'regional', constituencyId: 'region-2' },
        { electionId: 'presidential', constituencyId: 'whole-country' }
      ],
      nominationKeptElectionIds: []
    });
  });

  it('is served with the implied pair when its address names nothing and one election with one constituency is admissible', async () => {
    const result = await detailsLoad(eventOf('details', '', parentDataOf({ elections: ['national'] })));
    expect(result).toEqual({
      nominationContests: [{ electionId: 'national', constituencyId: 'whole-country' }],
      nominationKeptElectionIds: []
    });
  });

  it('forwards to the entry when its address names no election and none is implied', async () => {
    const world: World = { elections: ['national', 'regional'] };
    expect(await forwardOf(detailsLoad(eventOf('details', '', parentDataOf(world))))).toEqual({
      step: 'elections',
      selection: { electionIds: [], constituencyIds: [] }
    });
    expect(
      await forwardOf(detailsLoad(eventOf('details', searchOf({ constituencies: ['region-1'] }), parentDataOf(world))))
    ).toEqual({ step: 'elections', selection: { electionIds: [], constituencyIds: ['region-1'] } });
  });

  it('forwards to the constituency step when a chosen election has several constituencies and none of them is chosen', async () => {
    const world: World = { elections: ['national', 'regional'] };
    const run = detailsLoad(
      eventOf(
        'details',
        searchOf({ elections: ['national', 'regional'], constituencies: ['whole-country'] }),
        parentDataOf(world)
      )
    );
    expect(await forwardOf(run)).toEqual({
      step: 'constituencies',
      selection: { electionIds: ['national', 'regional'], constituencyIds: ['whole-country'] }
    });
  });

  it('drops an id that names nothing, and shows no error for it', async () => {
    const world: World = { elections: ['national', 'regional'] };
    const result = await detailsLoad(
      eventOf(
        'details',
        searchOf({ elections: ['no-such-election', 'regional'], constituencies: ['no-such-constituency', 'region-1'] }),
        parentDataOf(world)
      )
    );
    expect(result).toEqual({
      nominationContests: [{ electionId: 'regional', constituencyId: 'region-1' }],
      nominationKeptElectionIds: []
    });
  });

  it('forwards to the entry when every id of its address names nothing', async () => {
    const world: World = { elections: ['national', 'regional'] };
    const run = detailsLoad(
      eventOf(
        'details',
        searchOf({ elections: ['<b>x</b>'], constituencies: ['no-such-constituency'] }),
        parentDataOf(world)
      )
    );
    expect(await forwardOf(run)).toEqual({ step: 'elections', selection: { electionIds: [], constituencyIds: [] } });
  });

  it("drops an election that does not admit the entity's type, and a constituency of no admissible election", async () => {
    const world: World = { elections: ['national', 'regional', 'municipal'], admissible: ['national', 'regional'] };
    const result = await detailsLoad(
      eventOf(
        'details',
        searchOf({ elections: ['municipal', 'regional'], constituencies: ['municipality-1a', 'region-2'] }),
        parentDataOf(world)
      )
    );
    expect(result).toEqual({
      nominationContests: [{ electionId: 'regional', constituencyId: 'region-2' }],
      nominationKeptElectionIds: []
    });
  });
});

describe('the address of the details step, for an entity that has nominations', () => {
  const SEVERAL: World = {
    elections: ['national', 'regional', 'municipal'],
    nominations: [
      { electionId: 'regional', constituencyId: 'region-1' },
      { electionId: 'regional', constituencyId: 'region-2' }
    ]
  };

  it('is served for a chosen election with no constituency where the entity holds several nominations in it', async () => {
    const result = await detailsLoad(
      eventOf('details', searchOf({ elections: ['regional', 'national'] }), parentDataOf(SEVERAL))
    );
    expect(result).toEqual({
      nominationContests: [{ electionId: 'national', constituencyId: 'whole-country' }],
      nominationKeptElectionIds: ['regional']
    });
  });

  it('is served with no contest when every chosen election is kept as stored', async () => {
    const result = await detailsLoad(eventOf('details', searchOf({ elections: ['regional'] }), parentDataOf(SEVERAL)));
    expect(result).toEqual({ nominationContests: [], nominationKeptElectionIds: ['regional'] });
  });

  it('forwards to the constituency step for an election left to choose that has several constituencies and none chosen, beside a kept one', async () => {
    const run = detailsLoad(
      eventOf('details', searchOf({ elections: ['regional', 'municipal'] }), parentDataOf(SEVERAL))
    );
    expect(await forwardOf(run)).toEqual({
      step: 'constituencies',
      selection: { electionIds: ['municipal', 'regional'], constituencyIds: [] }
    });
  });

  it('forwards to the constituency step where the entity holds one nomination in a chosen election with several constituencies and none is chosen', async () => {
    const world: World = {
      elections: ['national', 'regional'],
      nominations: [{ electionId: 'regional', constituencyId: 'region-1' }]
    };
    const run = detailsLoad(eventOf('details', searchOf({ elections: ['regional'] }), parentDataOf(world)));
    expect(await forwardOf(run)).toEqual({
      step: 'constituencies',
      selection: { electionIds: ['regional'], constituencyIds: [] }
    });
  });

  it('forwards to the entry when its address names no election, whatever the entity is nominated in', async () => {
    const world: World = {
      elections: ['national', 'regional'],
      nominations: [{ electionId: 'national', constituencyId: 'whole-country' }]
    };
    expect(await forwardOf(detailsLoad(eventOf('details', '', parentDataOf(world))))).toEqual({
      step: 'elections',
      selection: { electionIds: [], constituencyIds: [] }
    });
  });
});

describe('every step, while nothing can be decided', () => {
  const LOADS: Array<{ step: string; load: StepLoad; nothing: unknown }> = [
    {
      step: 'elections',
      load: electionsLoad,
      nothing: { nominationSelection: { electionIds: [], constituencyIds: [] } }
    },
    {
      step: 'constituencies',
      load: constituenciesLoad,
      nothing: {
        nominationSelection: { electionIds: [], constituencyIds: [] },
        nominationConstituencyChoice: { toChoose: [], kept: [], onArrival: {} }
      }
    },
    { step: 'details', load: detailsLoad, nothing: { nominationContests: [], nominationKeptElectionIds: [] } }
  ];
  const SEARCH = searchOf({ elections: ['regional'], constituencies: ['region-1'] });

  it.each(LOADS)(
    '$step decides nothing and forwards nowhere while a gate is pending',
    async ({ step, load, nothing }) => {
      const parentData = { ...parentDataOf({ elections: ['national'] }), gate: 'termsOfUse' };
      expect(await load(eventOf(step, SEARCH, parentData))).toEqual(nothing);
    }
  );

  it.each(LOADS)(
    '$step decides nothing and forwards nowhere while the facts are not known',
    async ({ step, load, nothing }) => {
      const parentData = { ...parentDataOf({ elections: ['national'] }), nominationFacts: undefined };
      expect(await load(eventOf(step, SEARCH, parentData))).toEqual(nothing);
    }
  );
});

describe('where Continue of a selection step leads', () => {
  /** The values a page hands over, in the world given, with the selection the page holds and the entity's nominations in the editor's reach. */
  function factsOf(world: World, selection: NominationSelection): StepFacts {
    const dataRoot = new DataRoot();
    dataRoot.provideElectionData(world.elections.map((id) => ELECTIONS[id]));
    dataRoot.provideConstituencyData(CONSTITUENCY_DATA);
    const admissible = (world.admissible ?? world.elections).map((id) => dataRoot.getElection(id));
    const appSettings: AppSettings = {
      ...staticSettings,
      ...dynamicSettings,
      elections: { ...dynamicSettings.elections, startFromConstituencyGroup: world.startFromConstituencyGroup }
    };
    return { appSettings, dataRoot, admissible, selection, nominations: world.nominations ?? [] };
  }

  it('from the elections: the constituency step while a chosen election has several constituencies', () => {
    const selection = { electionIds: ['national', 'regional'], constituencyIds: [] };
    expect(afterElections(factsOf({ elections: ['national', 'regional', 'presidential'] }, selection))).toEqual({
      step: 'constituencies',
      selection
    });
  });

  it('from the elections: the details step, with each pair, when every chosen election has one constituency', () => {
    const selection = { electionIds: ['national', 'presidential'], constituencyIds: [] };
    expect(afterElections(factsOf({ elections: ['national', 'regional', 'presidential'] }, selection))).toEqual({
      step: 'details',
      selection: { electionIds: ['national', 'presidential'], constituencyIds: ['whole-country'] }
    });
  });

  it('from the elections: the details step when the one chosen election with several constituencies holds several nominations of the entity', () => {
    const world: World = {
      elections: ['national', 'regional'],
      nominations: [
        { electionId: 'regional', constituencyId: 'region-1' },
        { electionId: 'regional', constituencyId: 'region-2' }
      ]
    };
    expect(afterElections(factsOf(world, { electionIds: ['national', 'regional'], constituencyIds: [] }))).toEqual({
      step: 'details',
      selection: { electionIds: ['national', 'regional'], constituencyIds: ['whole-country'] }
    });
    expect(afterElections(factsOf(world, { electionIds: ['regional'], constituencyIds: [] }))).toEqual({
      step: 'details',
      selection: { electionIds: ['regional'], constituencyIds: [] }
    });
  });

  it('from the elections: the constituency step, with every chosen election, when one of them holds one nomination of the entity', () => {
    const world: World = {
      elections: ['national', 'regional'],
      nominations: [{ electionId: 'regional', constituencyId: 'region-1' }]
    };
    const selection = { electionIds: ['national', 'regional'], constituencyIds: [] };
    expect(afterElections(factsOf(world, selection))).toEqual({ step: 'constituencies', selection });
  });

  it('from the elections: the details step while a constituency group was chosen first', () => {
    const world: World = { elections: ['regional', 'municipal'], startFromConstituencyGroup: 'municipalities' };
    const selection = { electionIds: ['municipal'], constituencyIds: ['municipality-1a', 'region-1'] };
    expect(afterElections(factsOf(world, selection))).toEqual({ step: 'details', selection });
  });

  it('from the constituencies: the details step, with the elections of the address', () => {
    const selection = { electionIds: ['national', 'regional'], constituencyIds: ['region-1'] };
    expect(afterConstituencies(factsOf({ elections: ['national', 'regional'] }, selection))).toEqual({
      step: 'details',
      selection
    });
  });

  it('from the constituencies, chosen first: the details step for the one admissible election held there', () => {
    const world: World = { elections: ['national', 'regional'], startFromConstituencyGroup: 'regions' };
    expect(afterConstituencies(factsOf(world, { electionIds: [], constituencyIds: ['region-2'] }))).toEqual({
      step: 'details',
      selection: { electionIds: ['regional'], constituencyIds: ['region-2'] }
    });
  });

  it('from the constituencies, chosen first: the election step when several admissible elections are held there', () => {
    const world: World = { elections: ['regional', 'municipal'], startFromConstituencyGroup: 'municipalities' };
    const selection = { electionIds: ['municipal', 'national'], constituencyIds: ['municipality-1a', 'region-1'] };
    expect(afterConstituencies(factsOf(world, selection))).toEqual({
      step: 'elections',
      selection: { electionIds: ['municipal'], constituencyIds: ['municipality-1a', 'region-1'] }
    });
  });

  it('from the constituencies, chosen first: nowhere when no admissible election is held there', () => {
    const world: World = {
      elections: ['national', 'regional'],
      admissible: ['national'],
      startFromConstituencyGroup: 'regions'
    };
    expect(afterConstituencies(factsOf(world, { electionIds: [], constituencyIds: ['region-1'] }))).toBeUndefined();
  });

  it('from the constituencies, chosen first: the details step for the one admissible election, held in the constituency the chosen one lies in', () => {
    const world: World = {
      elections: ['regional', 'municipal'],
      admissible: ['regional'],
      startFromConstituencyGroup: 'municipalities'
    };
    const selection = { electionIds: ['regional'], constituencyIds: ['municipality-2a'] };
    expect(afterConstituencies(factsOf(world, selection))).toEqual({
      step: 'details',
      selection: { electionIds: ['regional'], constituencyIds: ['municipality-2a', 'region-2'] }
    });
  });

  it('a chosen constituency stands for the one it lies in, for an election that has none of those chosen', () => {
    const { dataRoot } = factsOf(
      { elections: ['national', 'regional', 'municipal'] },
      { electionIds: [], constituencyIds: [] }
    );
    const municipality = dataRoot.getConstituency('municipality-1b');

    /** The ids of the constituencies that those given stand for, for the elections named. */
    function stoodFor(elections: Array<ElectionName>, constituencies = [municipality]): Array<string> {
      return constituenciesStoodFor({
        elections: elections.map((id) => dataRoot.getElection(id)),
        constituencies
      }).map((constituency) => constituency.id);
    }

    expect(stoodFor(['regional'])).toEqual(['municipality-1b', 'region-1']);
    expect(stoodFor(['regional', 'municipal'])).toEqual(['municipality-1b', 'region-1']);
    expect(stoodFor(['municipal'])).toEqual(['municipality-1b']);
    expect(stoodFor(['national'])).toEqual(['municipality-1b']);
    expect(stoodFor([])).toEqual(['municipality-1b']);
    expect(stoodFor(['regional'], [dataRoot.getConstituency('region-2'), municipality])).toEqual([
      'region-2',
      'municipality-1b'
    ]);
    expect(stoodFor(['regional'], [])).toEqual([]);
  });

  it('the editor has no step to select on only for one admissible election with one constituency', () => {
    const none = { electionIds: [], constituencyIds: [] };
    expect(hasSelectionStep(factsOf({ elections: ['national'] }, none))).toBe(false);
    expect(hasSelectionStep(factsOf({ elections: ['regional'] }, none))).toBe(true);
    expect(hasSelectionStep(factsOf({ elections: ['national', 'presidential'] }, none))).toBe(true);
    expect(hasSelectionStep(factsOf({ elections: ['national', 'regional'], admissible: ['national'] }, none))).toBe(
      false
    );
  });
});
