import { describe, expect, test } from 'vitest';
import { allowedParentTypes, ENTITY_TYPE, isNominableInShape } from '../../internal';
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
});
