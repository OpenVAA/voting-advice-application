/**
 * The registration-mode rule, for the Edge Function that creates an identity's entity, and the decision of which entity type a registration through the identity provider creates.
 *
 * Pure functions and constants with no Deno imports, no URL imports and no reference to the Deno global, so the module can be imported by both the Edge Function and vitest. The settings are a parameter: the caller reads a project's stored settings, and this module only decides.
 *
 * ONE RULE, THREE READERS. The database asks `private.registration_mode_allowed_in` before it honours an invitation, the screens ask `isRegistrationModeAllowed` of `@openvaa/app-shared` before they offer a mode, and `registrationModeAllowed` below is the same rule for this Edge Function, which cannot import the shared package and so carries its own copy. `registrationMatrix.test.ts` asserts the copy against every row of the truth table in the pgTAP file whose name ends `-registration-mode-matrix.test.sql`, the table the other two readings are asserted against, so a rule changed in one place alone fails a suite.
 *
 * NEVER A DEFAULT. Settings that are not an object, or that store no usable matrix, allow nothing, so an unreadable settings value lists no entity type and every decision refuses.
 */

/** The entity types a project may list as served, in canonical order. */
export const SERVED_ENTITY_TYPES = ['candidate', 'organization'] as const;

/** An entity type a project may serve. */
export type ServedEntityType = (typeof SERVED_ENTITY_TYPES)[number];

/** The entity types the rule decides about and a registration may create, in canonical order. */
export const ENTITY_TYPES: ReadonlyArray<ServedEntityType> = SERVED_ENTITY_TYPES;

/** The registration modes, in canonical order. */
const REGISTRATION_MODES = ['identity_provider', 'email', 'code'] as const;

/** The mode of a registration through the identity provider. */
const IDENTITY_PROVIDER_MODE = 'identity_provider';

/** The entity type served when the stored list names none of the served types. */
const DEFAULT_SERVED_ENTITY_TYPE: ServedEntityType = 'candidate';

/** What the entity-type decision answers: the type to create, or a refusal. */
export type EntityTypeDecision = { entityType: ServedEntityType } | { refused: true };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function ownMember(object: Record<string, unknown>, key: string): unknown {
  return Object.hasOwn(object, key) ? object[key] : undefined;
}

function isEntityType(value: unknown): value is ServedEntityType {
  return ENTITY_TYPES.some((entityType) => entityType === value);
}

function isRegistrationMode(value: unknown): value is (typeof REGISTRATION_MODES)[number] {
  return REGISTRATION_MODES.some((mode) => mode === value);
}

/** The served types: those the stored list names, or candidates alone when the list is not an array naming at least one of them. */
function servedEntityTypes(contestantApp: Record<string, unknown>): Array<ServedEntityType> {
  const stored = ownMember(contestantApp, 'entityTypes');
  if (Array.isArray(stored)) {
    const declared = SERVED_ENTITY_TYPES.filter((entityType) => stored.includes(entityType));
    if (declared.length > 0) return declared;
  }
  return [DEFAULT_SERVED_ENTITY_TYPE];
}

/**
 * Whether entities of a type may register with a mode, under a project's stored settings.
 *
 * The type must be one of the entity types and the mode one of the registration modes; the type must be served; the stored matrix must be an object, the type's row in it an array, and the row must hold the mode. Everything else is false.
 *
 * @param settings - The project's stored settings, of any shape
 * @param entityType - The entity type registering
 * @param mode - The registration mode asked about
 * @returns Whether the registration is allowed
 */
export function registrationModeAllowed(settings: unknown, entityType: unknown, mode: unknown): boolean {
  if (!isEntityType(entityType) || !isRegistrationMode(mode)) return false;
  const root = isObject(settings) ? ownMember(settings, 'contestantApp') : undefined;
  const contestantApp = isObject(root) ? root : {};
  if (!servedEntityTypes(contestantApp).includes(entityType)) return false;
  const matrix = ownMember(contestantApp, 'registrationModes');
  if (!isObject(matrix)) return false;
  const row = ownMember(matrix, entityType);
  return Array.isArray(row) && row.includes(mode);
}

/**
 * The served entity types that may register through the identity provider.
 *
 * @param settings - The project's stored settings, of any shape
 * @returns The types in the order candidate, organization; none for settings that are not an object
 */
export function identityProviderEntityTypes(settings: unknown): Array<ServedEntityType> {
  return ENTITY_TYPES.filter((entityType) => registrationModeAllowed(settings, entityType, IDENTITY_PROVIDER_MODE));
}

/**
 * The entity type a registration through the identity provider creates.
 *
 * A named type is taken when it is served and allows the identity provider's mode. An absent type is taken as the one served type that allows the mode, and is refused when none or several do, because the choice would then be a guess. Any other value is refused.
 *
 * @param settings - The project's stored settings, of any shape
 * @param requested - The type the request names, or null or undefined when it names none
 * @returns The type to create, or a refusal
 */
export function resolveEntityType(settings: unknown, requested: unknown): EntityTypeDecision {
  const allowing = identityProviderEntityTypes(settings);
  if (requested === null || requested === undefined) {
    return allowing.length === 1 ? { entityType: allowing[0] } : { refused: true };
  }
  return isEntityType(requested) && allowing.includes(requested) ? { entityType: requested } : { refused: true };
}
