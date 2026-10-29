import { describe, expect, test } from 'vitest';
import {
  allowedParentTypes,
  DEFAULT_NOMINATION_SHAPE,
  ENTITY_TYPE,
  isNominableInShape,
  NOMINATION_SHAPE
} from '../../internal';
import type { EntityType, NominationShape } from '../../internal';

/** One cell of the matrix: a shape, an entity type, and what the two functions answer for the pair. */
type Cell = {
  shape: NominationShape;
  entityType: EntityType;
  nominable: boolean;
  parentTypes: Array<EntityType>;
  required: boolean;
};

const { Alliance, Candidate, Faction, Organization } = ENTITY_TYPE;

// The shapes are written as the values the database stores, so that the grid does not read them from the module it tests.
const CELLS: Array<Cell> = [
  { shape: 'organization_list', entityType: Candidate, nominable: true, parentTypes: [Organization], required: true },
  { shape: 'organization_list', entityType: Organization, nominable: true, parentTypes: [Alliance], required: false },
  { shape: 'organization_list', entityType: Faction, nominable: true, parentTypes: [Organization], required: true },
  { shape: 'organization_list', entityType: Alliance, nominable: true, parentTypes: [], required: false },
  {
    shape: 'organization_list_and_independents',
    entityType: Candidate,
    nominable: true,
    parentTypes: [Organization],
    required: false
  },
  {
    shape: 'organization_list_and_independents',
    entityType: Organization,
    nominable: true,
    parentTypes: [Alliance],
    required: false
  },
  {
    shape: 'organization_list_and_independents',
    entityType: Faction,
    nominable: true,
    parentTypes: [Organization],
    required: true
  },
  {
    shape: 'organization_list_and_independents',
    entityType: Alliance,
    nominable: true,
    parentTypes: [],
    required: false
  },
  { shape: 'candidate_only', entityType: Candidate, nominable: true, parentTypes: [], required: false },
  { shape: 'candidate_only', entityType: Organization, nominable: false, parentTypes: [], required: false },
  { shape: 'candidate_only', entityType: Faction, nominable: false, parentTypes: [], required: false },
  { shape: 'candidate_only', entityType: Alliance, nominable: false, parentTypes: [], required: false },
  { shape: 'organization_only', entityType: Candidate, nominable: false, parentTypes: [], required: false },
  { shape: 'organization_only', entityType: Organization, nominable: true, parentTypes: [Alliance], required: false },
  { shape: 'organization_only', entityType: Faction, nominable: false, parentTypes: [], required: false },
  { shape: 'organization_only', entityType: Alliance, nominable: true, parentTypes: [], required: false }
];

test('The grid holds each of the sixteen cells once', () => {
  expect(CELLS).toHaveLength(16);
  expect(new Set(CELLS.map(({ shape, entityType }) => `${shape}/${entityType}`)).size).toBe(16);
});

describe('NOMINATION_SHAPE', () => {
  test('Should name the four shapes by the values the database stores', () => {
    expect(NOMINATION_SHAPE).toEqual({
      OrganizationOnly: 'organization_only',
      CandidateOnly: 'candidate_only',
      OrganizationList: 'organization_list',
      OrganizationListAndIndependents: 'organization_list_and_independents'
    });
  });

  test('Should have organization_list_and_independents as the default shape', () => {
    expect(DEFAULT_NOMINATION_SHAPE).toBe('organization_list_and_independents');
  });
});

describe('isNominableInShape', () => {
  test.each(CELLS)('Should answer $nominable for a $entityType in $shape', ({ shape, entityType, nominable }) => {
    expect(isNominableInShape(shape, entityType)).toBe(nominable);
  });
});

describe('allowedParentTypes', () => {
  test.each(CELLS)(
    'Should answer $parentTypes, required $required, for a $entityType in $shape',
    ({ shape, entityType, parentTypes, required }) => {
      expect(allowedParentTypes(shape, entityType)).toEqual({ types: parentTypes, required });
    }
  );

  test.each(CELLS)('Should never offer a faction as the parent of a $entityType in $shape', ({ shape, entityType }) => {
    expect(allowedParentTypes(shape, entityType).types).not.toContain(Faction);
  });

  test.each(CELLS.filter((cell) => !cell.nominable))(
    'Should give the empty answer for a $entityType in $shape, where it is not nominable',
    ({ shape, entityType }) => {
      expect(allowedParentTypes(shape, entityType)).toEqual({ types: [], required: false });
    }
  );

  test.each(CELLS)('Should return a fresh answer on each call for a $entityType in $shape', ({ shape, entityType }) => {
    const first = allowedParentTypes(shape, entityType);
    const expected = [...first.types];
    (first.types as Array<EntityType>).push(Faction);
    const second = allowedParentTypes(shape, entityType);
    expect(second).not.toBe(first);
    expect(second.types).toEqual(expected);
  });
});
