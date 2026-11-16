import { dynamicSettings } from './dynamicSettings';
import { isPlainObject } from '../data/utils/isPlainObject';
import type { EntityType } from '@openvaa/data';

/**
 * The entity types a Contestant App can serve, in canonical order. A project declares the ones it serves in `contestantApp.entityTypes`.
 */
export const SERVED_ENTITY_TYPES = ['candidate', 'organization'] as const satisfies ReadonlyArray<EntityType>;

/**
 * An entity type a Contestant App can serve.
 */
export type ServedEntityType = (typeof SERVED_ENTITY_TYPES)[number];

/**
 * The ways a contestant can register. A project declares the ones it allows for each served entity type in `contestantApp.registrationModes`. An invitation is honoured under a mode as well: one bound to an email address under `email` and one bound to a code under `code`, each for the entity type of its target. The database enforces this: while the mode is not allowed, an open invitation of a candidate or an organization is treated as absent.
 */
export const REGISTRATION_MODE = {
  /**
   * Registration by identifying with an external identity provider.
   */
  IdentityProvider: 'identity_provider',
  /**
   * Registration with an email address.
   */
  Email: 'email',
  /**
   * Registration with a registration code.
   */
  Code: 'code'
} as const;

/**
 * A way a contestant can register.
 */
export type RegistrationMode = (typeof REGISTRATION_MODE)[keyof typeof REGISTRATION_MODE];

/**
 * The registration modes in canonical order.
 */
export const REGISTRATION_MODES = [
  REGISTRATION_MODE.IdentityProvider,
  REGISTRATION_MODE.Email,
  REGISTRATION_MODE.Code
] as const;

/**
 * Assert that a value is a `RegistrationMode`.
 */
export function isRegistrationMode(value: unknown): value is RegistrationMode {
  return REGISTRATION_MODES.includes(value as RegistrationMode);
}

/**
 * The registration modes allowed for each entity type a Contestant App can serve.
 */
export type RegistrationModeMatrix = Record<ServedEntityType, Array<RegistrationMode>>;

/**
 * The key, under the `dynamic.contestantAppName` message group, of the name a Contestant App gives itself.
 */
export type ContestantAppNameKey = 'candidate' | 'organization' | 'candidateAndOrganization';

/**
 * What the accessors in this module read: any value that may carry a `contestantApp` settings root. The merged application settings, the stored settings as a data provider returns them and `{}` are all valid. The root, each of its two list members and the matrix may be absent, and an absent one reads as its shipped default. A row absent from a matrix that is present reads as an empty row: the type allows no registration mode.
 */
export type ContestantAppConfigInput =
  | {
      contestantApp?: {
        entityTypes?: ReadonlyArray<ServedEntityType>;
        registrationModes?: { readonly [TType in ServedEntityType]?: ReadonlyArray<RegistrationMode> };
      } | null;
    }
  | null
  | undefined;

/**
 * The members of `vocabulary` that `stored` lists, in the vocabulary's order and without repeats. Anything that is not a list reads as an empty list.
 */
function membersOf<TValue extends string>(vocabulary: ReadonlyArray<TValue>, stored: unknown): Array<TValue> {
  if (!Array.isArray(stored)) return [];
  return vocabulary.filter((value) => stored.includes(value));
}

/**
 * The entity types the Contestant App serves, in canonical order and without repeats. Never empty: when none is declared, the shipped default applies.
 * @param input - The settings to read.
 */
export function getServedEntityTypes(input: ContestantAppConfigInput): Array<ServedEntityType> {
  const declared = membersOf(SERVED_ENTITY_TYPES, input?.contestantApp?.entityTypes);
  if (declared.length) return declared;
  return membersOf(SERVED_ENTITY_TYPES, dynamicSettings.contestantApp.entityTypes);
}

/**
 * The registration modes in effect: one row for each served entity type and no other row, each in canonical order and without repeats. A row declared for an entity type the project does not serve is left out, and a served type with no declared row has an empty one.
 * @param input - The settings to read.
 */
export function getEffectiveRegistrationModes(input: ContestantAppConfigInput): Partial<RegistrationModeMatrix> {
  const declared = input?.contestantApp?.registrationModes;
  const matrix: Record<string, unknown> = isPlainObject(declared)
    ? declared
    : dynamicSettings.contestantApp.registrationModes;
  const effective: Partial<RegistrationModeMatrix> = {};
  for (const entityType of getServedEntityTypes(input)) {
    effective[entityType] = membersOf(REGISTRATION_MODES, matrix[entityType]);
  }
  return effective;
}

/**
 * Whether entities of a type may register with a mode: the project serves the type and allows the mode for it.
 * @param input - The settings to read.
 * @param entityType - The entity type registering.
 * @param mode - The registration mode asked about.
 */
export function isRegistrationModeAllowed(
  input: ContestantAppConfigInput,
  entityType: ServedEntityType,
  mode: RegistrationMode
): boolean {
  return getEffectiveRegistrationModes(input)[entityType]?.includes(mode) ?? false;
}

/**
 * Whether entities of at least one served type may register with a mode.
 * @param input - The settings to read.
 * @param mode - The registration mode asked about.
 */
export function isRegistrationModeAllowedForAnyType(input: ContestantAppConfigInput, mode: RegistrationMode): boolean {
  return Object.values(getEffectiveRegistrationModes(input)).some((modes) => modes.includes(mode));
}

/**
 * Whether entities of at least one served type may register with at least one mode.
 * @param input - The settings to read.
 */
export function isAnyRegistrationAllowed(input: ContestantAppConfigInput): boolean {
  return Object.values(getEffectiveRegistrationModes(input)).some((modes) => modes.length > 0);
}

/**
 * The key of the name the Contestant App gives itself, which follows the entity types it serves.
 * @param input - The settings to read.
 */
export function getContestantAppNameKey(input: ContestantAppConfigInput): ContestantAppNameKey {
  const served = getServedEntityTypes(input);
  const servesOrganizations = served.includes('organization');
  if (served.includes('candidate') && servesOrganizations) return 'candidateAndOrganization';
  return servesOrganizations ? 'organization' : 'candidate';
}
