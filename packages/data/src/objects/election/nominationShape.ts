/**
 * Which entity types an election admits as nominees, and which parent each may name: the nomination-shape matrix, stated once for the application.
 *
 * The database states the same matrix in `public.nomination_shape_rule` and refuses every write that breaks it; the section "Nomination rules: the data model and the database" of the package's README compares the two statements.
 *
 * The module is pure: both functions take values and return fresh ones, and neither reads a `DataRoot`. The entity types are read inside the function bodies and never when the module loads, because the barrel loads this file before the entity types.
 *
 * Tested in `nominationShape.test.ts`.
 */

import { ENTITY_TYPE, isEntityType } from '../../internal';
import type { EntityType } from '../../internal';

/**
 * The nomination shapes of an election, by the values the database stores in `elections.election_type`.
 */
export const NOMINATION_SHAPE = {
  /**
   * Organizations and alliances are nominated; candidates and factions are not.
   */
  OrganizationOnly: 'organization_only',
  /**
   * Candidates alone are nominated, and none names a parent.
   */
  CandidateOnly: 'candidate_only',
  /**
   * Closed lists: every entity type is nominated, and a candidate must name the organization whose list it is on.
   */
  OrganizationList: 'organization_list',
  /**
   * Lists and independents: every entity type is nominated, and a candidate may name an organization or stand without one.
   */
  OrganizationListAndIndependents: 'organization_list_and_independents'
} as const;

/**
 * The nomination shape of an election: which entity types it admits as nominees and which parent each may name.
 */
export type NominationShape = (typeof NOMINATION_SHAPE)[keyof typeof NOMINATION_SHAPE];

/**
 * The shape of an election whose data states none. It is the default of the database's `elections.election_type` column.
 */
export const DEFAULT_NOMINATION_SHAPE: NominationShape = NOMINATION_SHAPE.OrganizationListAndIndependents;

/**
 * The parents an entity type may name in an election of a given shape.
 */
export type AllowedParentTypes = {
  /**
   * The entity types the parent may be. Empty when no parent is named. A faction is never among them.
   */
  types: ReadonlyArray<EntityType>;
  /**
   * Whether a parent must be named. Always `false` when `types` is empty.
   */
  required: boolean;
};

/**
 * Whether an entity of the given type may be nominated in an election of the given shape.
 *
 * Asked wherever elections are offered to an entity or counted for it: an election that answers `false` is not offered and holds no task for the entity. A shape that is not one of `NOMINATION_SHAPE` admits nothing.
 *
 * @param shape - The election's nomination shape, as `Election.nominationShape` gives it.
 * @param entityType - The type of the entity that would be nominated.
 * @returns `true` exactly where `public.nomination_shape_rule` answers anything but `refused`.
 */
export function isNominableInShape(shape: NominationShape, entityType: EntityType): boolean {
  switch (shape) {
    case NOMINATION_SHAPE.OrganizationList:
    case NOMINATION_SHAPE.OrganizationListAndIndependents:
      return isEntityType(entityType);
    case NOMINATION_SHAPE.CandidateOnly:
      return entityType === ENTITY_TYPE.Candidate;
    case NOMINATION_SHAPE.OrganizationOnly:
      return entityType === ENTITY_TYPE.Organization || entityType === ENTITY_TYPE.Alliance;
    default:
      return false;
  }
}

/**
 * Which entity types an entity of the given type may name as its parent in an election of the given shape, and whether it must name one.
 *
 * Asked wherever a nomination's parent is chosen: an empty `types` means no parent is asked for, and `required` says whether the choice may be left empty. Where the entity type is not nominable in the shape the answer is the empty one.
 *
 * @param shape - The election's nomination shape, as `Election.nominationShape` gives it.
 * @param entityType - The type of the entity that would be nominated.
 * @returns A fresh object on every call.
 */
export function allowedParentTypes(shape: NominationShape, entityType: EntityType): AllowedParentTypes {
  if (!isNominableInShape(shape, entityType)) return { types: [], required: false };
  switch (entityType) {
    case ENTITY_TYPE.Candidate:
      return shape === NOMINATION_SHAPE.CandidateOnly
        ? { types: [], required: false }
        : { types: [ENTITY_TYPE.Organization], required: shape === NOMINATION_SHAPE.OrganizationList };
    case ENTITY_TYPE.Organization:
      return { types: [ENTITY_TYPE.Alliance], required: false };
    case ENTITY_TYPE.Faction:
      return { types: [ENTITY_TYPE.Organization], required: true };
    default:
      return { types: [], required: false };
  }
}
