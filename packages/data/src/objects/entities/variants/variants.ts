import type { Alliance, Candidate, ENTITY_TYPE, EntityType, Faction, Organization } from '../../../internal';

/**
 * Entity variants
 * This file contains type and class mappings for all concrete entity types, i.e. those that are not abstract base classes.
 * NB. Make sure to update the types below whenever implemeting new entity variants.
 */

/**
 * A map of the concrete entity constructors by their entity type.
 */
export type EntityVariantConstructor = {
  [ENTITY_TYPE.Candidate]: typeof Candidate;
  [ENTITY_TYPE.Faction]: typeof Faction;
  [ENTITY_TYPE.Organization]: typeof Organization;
  [ENTITY_TYPE.Alliance]: typeof Alliance;
};

/**
 * A map of the concrete entity instances by their entity type.
 */
export type EntityVariant = {
  [KType in EntityType]: InstanceType<EntityVariantConstructor[KType]>;
};

/**
 * Any concrete entity entity.
 */
export type AnyEntityVariant = EntityVariant[keyof EntityVariant];

/**
 * A map of the concrete entity constructors’ data arguments by their entity type.
 */
export type EntityVariantData = {
  [KType in EntityType]: ConstructorParameters<EntityVariantConstructor[KType]>[0]['data'];
};

/**
 * Any concrete entity constructors’ data argument type.
 */
export type AnyEntityVariantData = EntityVariantData[keyof EntityVariantData];

/**
 * An alternative data structure for `EntityData` with the `type`s specified hierarchically as keys.
 * Use the `parseEntityTree` util to convert these to a canonical array.
 */
export type EntityVariantTree = {
  [K in EntityType]: Array<Omit<EntityVariantData[K], 'type'>>;
};

/**
 * Parse a `EntityVariantTree` into an array of `EntityVariantPublicData`.
 */
export function parseEntityTree(tree: EntityVariantTree): Array<AnyEntityVariantData> {
  const entities = new Array<AnyEntityVariantData>();
  for (const [type, data] of Object.entries(tree))
    entities.push(...data.map((d) => ({ ...d, type }) as AnyEntityVariantData));
  return entities;
}
