/**
 * `groupEntitiesForSelection`: which groups the entity-selection view renders and in which order.
 */

import { describe, expect, it } from 'vitest';
import { groupEntitiesForSelection } from './entitySelection.helpers';

type TestEntity = { type: 'candidate' | 'organization'; id: string; name: string };

const ZOE: TestEntity = { type: 'candidate', id: 'c-1', name: 'Zoe Zeta' };
const ADA: TestEntity = { type: 'candidate', id: 'c-2', name: 'Ada Alpha' };
const MIA: TestEntity = { type: 'candidate', id: 'c-3', name: 'Mia Mu' };
const UNION: TestEntity = { type: 'organization', id: 'o-1', name: 'Union Party' };
const ALLIANCE: TestEntity = { type: 'organization', id: 'o-2', name: 'Alliance Party' };

/** The name a test entity is shown by. */
function displayName(entity: TestEntity): string {
  return entity.name;
}

/** The ids of every group, in order. */
function idsOf(entities: ReadonlyArray<TestEntity>, locale = 'en'): Array<[string, Array<string>]> {
  return groupEntitiesForSelection({ entities, locale, displayName }).groups.map((group) => [
    group.type,
    group.entities.map((entity) => entity.id)
  ]);
}

/** Every order the given entities can be listed in. */
function permutations<TItem>(items: ReadonlyArray<TItem>): Array<Array<TItem>> {
  if (items.length <= 1) return [[...items]];
  return items.flatMap((item, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest])
  );
}

describe('groupEntitiesForSelection — both types', () => {
  it('lists candidates before organizations, each group ascending by display name', () => {
    expect(idsOf([UNION, ZOE, ALLIANCE, MIA, ADA])).toEqual([
      ['candidate', ['c-2', 'c-3', 'c-1']],
      ['organization', ['o-2', 'o-1']]
    ]);
  });

  it('heads the groups', () => {
    expect(groupEntitiesForSelection({ entities: [UNION, ZOE], locale: 'en', displayName }).showHeadings).toBe(true);
  });

  it('gives the same result for every order of the input', () => {
    const expected = idsOf([ZOE, ADA, MIA, UNION, ALLIANCE]);

    for (const order of permutations([ZOE, ADA, MIA, UNION, ALLIANCE])) expect(idsOf(order)).toEqual(expected);
  });

  it('returns the entities it was given, not copies', () => {
    const { groups } = groupEntitiesForSelection({ entities: [UNION, ZOE], locale: 'en', displayName });

    expect(groups[0].entities[0]).toBe(ZOE);
    expect(groups[1].entities[0]).toBe(UNION);
  });
});

describe('groupEntitiesForSelection — one type', () => {
  it.each([
    ['candidates only', [ZOE, ADA], 'candidate', ['c-2', 'c-1']],
    ['organizations only', [UNION, ALLIANCE], 'organization', ['o-2', 'o-1']]
  ] as const)('yields one group and no headings for %s', (_, entities, type, ids) => {
    const selection = groupEntitiesForSelection({ entities, locale: 'en', displayName });

    expect(selection.showHeadings).toBe(false);
    expect(selection.groups).toHaveLength(1);
    expect(selection.groups[0].type).toBe(type);
    expect(selection.groups[0].entities.map((entity) => entity.id)).toEqual(ids);
  });

  it('yields no group for no entity', () => {
    expect(groupEntitiesForSelection({ entities: [], locale: 'en', displayName })).toEqual({
      groups: [],
      showHeadings: false
    });
  });
});

describe('groupEntitiesForSelection — names that compare as equal', () => {
  const LOWER: TestEntity = { type: 'candidate', id: 'c-b', name: 'anna aalto' };
  const UPPER: TestEntity = { type: 'candidate', id: 'c-a', name: 'Anna Aalto' };
  const ACCENTED: TestEntity = { type: 'candidate', id: 'c-c', name: 'Ánna Aalto' };
  const SAME: TestEntity = { type: 'candidate', id: 'c-d', name: 'Anna Aalto' };

  it('breaks a tie of case, accent or an identical name by id, whatever the input order', () => {
    for (const order of permutations([LOWER, UPPER, ACCENTED, SAME]))
      expect(idsOf(order)).toEqual([['candidate', ['c-a', 'c-b', 'c-c', 'c-d']]]);
  });

  it('keeps a name that sorts earlier ahead of the tied ones', () => {
    const FIRST: TestEntity = { type: 'candidate', id: 'c-z', name: 'Aada Aalto' };

    expect(idsOf([LOWER, FIRST, UPPER])).toEqual([['candidate', ['c-z', 'c-a', 'c-b']]]);
  });
});

describe('groupEntitiesForSelection — the locale', () => {
  const A_RING: TestEntity = { type: 'candidate', id: 'c-1', name: 'Åberg' };
  const Z: TestEntity = { type: 'candidate', id: 'c-2', name: 'Zetterberg' };

  it('compares names by the rules of the locale it is given', () => {
    // Swedish sorts Å after Z; English treats it as an accented A.
    expect(idsOf([A_RING, Z], 'sv')).toEqual([['candidate', ['c-2', 'c-1']]]);
    expect(idsOf([A_RING, Z], 'en')).toEqual([['candidate', ['c-1', 'c-2']]]);
  });
});
