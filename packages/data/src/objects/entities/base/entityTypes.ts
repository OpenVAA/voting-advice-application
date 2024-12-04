/**
 * The types of any entity. The `type` property of `EntityData` determines the `Entity` subclass that it uses.
 */
export const ENTITY_TYPE = {
  /**
   * A candidate.
   */
  Candidate: 'candidate',
  /**
   * A faction.
   */
  Faction: 'faction',
  /**
   * A political organization, usually a political party. If you want to differentiate between parties and other nomination organizations, such as constituency assocations, you can use the `subtype?: string` property inherited from `DataObject`.
   */
  Organization: 'organization',
  /**
   * An electoral alliance between organizations.
   */
  Alliance: 'alliance'
} as const;

/**
 * The types of any entity. The `type` property of `EntityData` determines the `Entity` subclass that it uses.
 */
export type EntityType = (typeof ENTITY_TYPE)[keyof typeof ENTITY_TYPE];

/**
 * Assert that a string is an `EntityType`.
 */
export function isEntityType(value: unknown): value is EntityType {
  return Object.values(ENTITY_TYPE).includes(value as EntityType);
}
