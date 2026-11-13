import { Candidate, ENTITY_TYPE } from '@openvaa/data';
import type { CandidateData, DataRoot, OrganizationData } from '@openvaa/data';
import type { UserEntity } from '$lib/api/base/dataWriter.type';

/**
 * The entity data a `DataRoot` takes for one entity the signed-in user edits, as the user-level list holds it. Whether the entity is confirmed is left out: the data model has no such member.
 * @param entity - The listed entity.
 * @returns The data to provide to a `DataRoot`.
 */
export function userEntityData(entity: UserEntity): CandidateData | OrganizationData {
  const { id, shortName, image, color } = entity;
  return entity.type === ENTITY_TYPE.Candidate
    ? {
        type: ENTITY_TYPE.Candidate,
        id,
        shortName,
        image,
        color,
        firstName: entity.firstName,
        lastName: entity.lastName
      }
    : { type: ENTITY_TYPE.Organization, id, shortName, image, color, name: entity.name };
}

/**
 * The one string an entity the signed-in user edits is shown by, wherever the app names it. It equals the `name` of the object a `DataRoot` builds from `userEntityData(entity)`, and needs no entity to be provided to the root.
 * @param entity - The listed entity.
 * @param dataRoot - The root whose formatter and locale a candidate's name is built with.
 * @returns A candidate's formatted name, or an organization's name.
 */
export function userEntityDisplayName(entity: UserEntity, dataRoot: DataRoot): string {
  if (entity.type === ENTITY_TYPE.Candidate)
    return new Candidate({ data: userEntityData(entity) as CandidateData, root: dataRoot }).name;
  return entity.name;
}
