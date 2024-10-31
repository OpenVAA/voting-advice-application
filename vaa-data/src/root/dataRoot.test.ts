import {expect, test} from 'vitest';
import {
  getTestDataRoot,
  getTestData,
  parseNestedNominations,
  contentsMatch,
  ExtendedNominationData
} from '../testUtils';
import {DataRoot} from './dataRoot';
import {
  AnyNominationVariant,
  EntityType,
  Id,
  Nomination,
  NominationData,
  parseNominationTree
} from '../internal';

/**
 * Some of `DataRoot`’s methods are in effect tested by `getDataRoot` or the object classes and will not be repeated here, e.g.:
 * - getEntity
 * - getNomination
 * - data provision methods
 * - text formatters
 */

const root = getTestDataRoot();
const data = getTestData();
const nominationData = parseNestedNominations(parseNominationTree(data.nominations));

/** For accessing the protected children property */
class MockDataRoot extends DataRoot {
  get childrenObject() {
    return this.children;
  }
}
const mockRoot = new MockDataRoot(getTestData());

test('Should have array and id-based getters for all child collections', () => {
  for (const collection of Object.keys(mockRoot.childrenObject)) {
    expect(
      Array.isArray(mockRoot[collection]),
      `To have a collection array getter for ${collection}`
    ).toBe(true);
    const singular = collection.endsWith('ies')
      ? `${collection.slice(0, -3)}y`
      : `${collection.slice(0, -1)}`;
    const byIdGetter = `get${singular.charAt(0).toUpperCase()}${singular.slice(1)}`;
    expect(typeof mockRoot[byIdGetter], `To have id based object getter for ${collection}`).toBe(
      'function'
    );
  }
});

test('GetNomination should work', () => {
  // This test is a bit circular but we don't have any other easy way of getting the nomination ids
  const allNominations = Object.entries(mockRoot.childrenObject)
    .filter(([k]) => k.endsWith('Nominations'))
    .flatMap(([, v]) => [...v.values()]) as Array<AnyNominationVariant>;
  for (const {id, entityType} of allNominations) {
    expect(mockRoot.getNomination(entityType, id).id).toBe(id);
  }
});

test('FindNominations should work', () => {
  if (nominationData.length === 0)
    throw new Error('Test setup error: No nomination data available');
  for (const {entityType, electionId, constituencyId} of nominationData) {
    const fullMatch = nominationData.filter(
      (n) =>
        n.entityType === entityType &&
        n.electionId === electionId &&
        n.constituencyId === constituencyId
    );
    const partialMatch = nominationData.filter(
      (n) => n.entityType === entityType && n.electionId === electionId
    );
    expect(
      contentsMatch(
        root.findNominations({entityType, electionId, constituencyId})!.map(hashNomination),
        fullMatch.map(hashNominationData)
      )
    ).toBe(true);
    expect(
      contentsMatch(
        root.findNominations({entityType, electionId})!.map(hashNomination),
        partialMatch.map(hashNominationData)
      )
    ).toBe(true);
  }
});

test('GetNominationsForEntity should return the correct number of nominations', () => {
  if (nominationData.length === 0)
    throw new Error('Test setup error: No nomination data available');

  // Count nominations in the data
  const countsById: {
    [entityType: string]: {
      [entityId: Id]: number;
    };
  } = {};
  const countsByType: {
    [entityType: string]: number;
  } = {};
  nominationData.forEach(({entityType, entityId}) => {
    countsByType[entityType] ??= 0;
    countsByType[entityType]++;
    if (!entityId) return;
    countsById[entityType] ??= {};
    countsById[entityType][entityId] ??= 0;
    countsById[entityType][entityId]++;
  });

  // Check that we have the correct number of nominations for each explicit entity
  nominationData
    .filter((n) => n.entityId)
    .forEach(({entityType, entityId}) => {
      expect(
        root.getNominationsForEntity({type: entityType, id: entityId})?.length,
        `To have the correct number of nominations for ${entityType} ${entityId}`
      ).toEqual(countsById[entityType][entityId]);
    });

  // Count the total number of nominations in the root for each entity type
  const countsByTypeInRoot: typeof countsByType = {};
  [
    ...(root.alliances ?? []),
    ...(root.candidates ?? []),
    ...(root.factions ?? []),
    ...(root.organizations ?? [])
  ].forEach(({type, id}) => {
    countsByTypeInRoot[type] ??= 0;
    const count = root.getNominationsForEntity({type, id})?.length;
    expect(count).toBeDefined();
    countsByTypeInRoot[type] += count!;
  });

  // Check that the counts match
  expect(
    countsByTypeInRoot,
    'The root to have the same number of nominations for each entity type as in the data'
  ).toEqual(countsByType);
});

test('GetNominationsForConstituency should work', () => {
  if (nominationData.length === 0)
    throw new Error('Test setup error: No nomination data available');

  // Count nominations in the data
  const countsByConstituency: {
    [electionId: Id]: {
      [constituencyId: Id]: {
        [entityType: string]: number;
      };
    };
  } = {};
  nominationData.forEach(({electionId, constituencyId, entityType}) => {
    countsByConstituency[electionId] ??= {};
    countsByConstituency[electionId][constituencyId] ??= {};
    countsByConstituency[electionId][constituencyId][entityType] ??= 0;
    countsByConstituency[electionId][constituencyId][entityType]++;
  });

  for (const [electionId, eCounts] of Object.entries(countsByConstituency)) {
    for (const [constituencyId, cCounts] of Object.entries(eCounts)) {
      for (const [type, count] of Object.entries(cCounts)) {
        expect(
          root.getNominationsForConstituency({electionId, constituencyId, type: type as EntityType})
            ?.length,
          `To have the correct number of nominations for entity type ${type} in election ${electionId} and constituency ${constituencyId}`
        ).toEqual(count);
      }
    }
  }
});

test('Should create unique ids', () => {
  const seen = new Set<Id>();
  for (let i = 0; i < 1000; i++) seen.add(root.createId('nomination'));
  expect(seen.size).toBe(1000);
});

/**
 * Creates a unique-ish hash from a `Nomination` object so that the two can be compared without the need for an `Id`.
 */
function hashNomination(nomination: AnyNominationVariant): string {
  return JSON.stringify([
    nomination.entity.type,
    nomination.election.id,
    nomination.constituency.id,
    nomination.parentNomination ? hashNomination(nomination.parentNomination) : null,
    'candidateNominations' in nomination
      ? nomination.candidateNominations.map((n) => n.entity.id)
      : []
  ]);
}

/**
 * Creates a unique-ish hash from a `NominationData` object so that the two can be compared without the need for an `Id`.
 */
function hashNominationData(nomination: ExtendedNominationData): string {
  return JSON.stringify([
    nomination.entityType,
    nomination.electionId,
    nomination.constituencyId,
    nomination.parent ? hashNominationData(nomination.parent) : null,
    'candidates' in nomination ? (nomination.candidates ?? []).map((n) => n.entityId) : []
  ]);
}
