/**
 * The decision of which entity type a registration through the identity provider creates, among the types the database allows.
 *
 * Pure functions and constants with no Deno imports, no URL imports and no reference to the Deno global, so the module can be imported by both the Edge Function and vitest.
 *
 * THE RULE IS THE DATABASE'S. `public.identity_provider_entity_types` answers the served entity types of a project whose registration modes allow the identity provider, by `private.registration_mode_allowed`, and none while the project's Contestant App is switched off. This module only chooses among the types it answered, so the rule is never restated here.
 */

/** The entity types a project may serve, in canonical order. */
export const SERVED_ENTITY_TYPES = ['candidate', 'organization'] as const;

/** An entity type a project may serve. */
export type ServedEntityType = (typeof SERVED_ENTITY_TYPES)[number];

/** What the entity-type decision answers: the type to create, or a refusal. */
export type EntityTypeDecision = { entityType: ServedEntityType } | { refused: true };

/**
 * Read the answer of `public.identity_provider_entity_types`.
 *
 * @param answer - The function's answer, of any type
 * @returns The entity types it names, in canonical order; none for a null answer; and null for an answer that is neither null nor a list of served entity types, which the caller must not read as allowing anything
 */
export function allowedEntityTypes(answer: unknown): Array<ServedEntityType> | null {
  if (answer === null) return [];
  if (!Array.isArray(answer) || !answer.every(isServedEntityType)) return null;
  return SERVED_ENTITY_TYPES.filter((entityType) => answer.includes(entityType));
}

/**
 * The entity type a registration through the identity provider creates.
 *
 * A named type is taken when it is one of the allowed types. An absent type is taken as the one allowed type, and is refused when none or several are allowed, because the choice would then be a guess. Any other value is refused.
 *
 * @param allowed - The entity types the database allows for the identity provider's mode
 * @param requested - The type the request names, or null or undefined when it names none
 * @returns The type to create, or a refusal
 */
export function resolveEntityType(allowed: ReadonlyArray<ServedEntityType>, requested: unknown): EntityTypeDecision {
  if (requested === null || requested === undefined) {
    return allowed.length === 1 ? { entityType: allowed[0] } : { refused: true };
  }
  return isServedEntityType(requested) && allowed.includes(requested) ? { entityType: requested } : { refused: true };
}

/**
 * Whether a value is an entity type a project may serve.
 *
 * @param value - The value, of any type
 * @returns True for one of `SERVED_ENTITY_TYPES`
 */
export function isServedEntityType(value: unknown): value is ServedEntityType {
  return SERVED_ENTITY_TYPES.some((entityType) => entityType === value);
}
