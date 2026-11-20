import { dynamicSettings } from './dynamicSettings';
import type { EntityType } from '@openvaa/data';

/**
 * The entity types a Contestant App can serve, in canonical order. A project declares the ones it serves as the keys of `contestantApp.servedEntityTypes`.
 */
export const SERVED_ENTITY_TYPES = ['candidate', 'organization'] as const satisfies ReadonlyArray<EntityType>;

/**
 * An entity type a Contestant App can serve.
 */
export type ServedEntityType = (typeof SERVED_ENTITY_TYPES)[number];

/**
 * The ways a contestant can register. A project declares the ones it allows for each served entity type in that type's `registrationModes` under `contestantApp.servedEntityTypes`. An invitation is honoured under a mode as well: one bound to an email address under `email` and one bound to a code under `code`, each for the entity type of its target. The database enforces this: while the mode is not allowed, an open invitation of a candidate or an organization is treated as absent.
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
 * The registration modes allowed for each entity type a Contestant App can serve.
 */
export type RegistrationModeMatrix = Record<ServedEntityType, Array<RegistrationMode>>;

/**
 * The key, under the `dynamic.contestantAppName` message group, of the name a Contestant App gives itself.
 */
export type ContestantAppNameKey = 'candidate' | 'organization' | 'candidateAndOrganization';

/**
 * What the accessors in this module read: any value that may carry a `contestantApp` settings root. The merged application settings, the stored settings as a data provider returns them and `{}` are all valid. The root and its `servedEntityTypes` member may be absent, and an absent member, or one with no key, reads as the shipped default. A served type whose entry has no `registrationModes` allows no registration mode.
 */
export type ContestantAppSettingsInput =
  | {
      contestantApp?: {
        servedEntityTypes?: {
          readonly [TType in ServedEntityType]?: { readonly registrationModes?: ReadonlyArray<RegistrationMode> };
        };
      } | null;
    }
  | null
  | undefined;

/**
 * The entity types the Contestant App serves, in canonical order. Never empty: when the settings serve none, the shipped default applies.
 * @param input - The settings to read.
 */
export function getServedEntityTypes(input: ContestantAppSettingsInput): Array<ServedEntityType> {
  return servedTypesOf(servedEntityTypesOf(input));
}

/**
 * The registration modes in effect: one row for each served entity type and no other row, each in canonical order and without repeats.
 * @param input - The settings to read.
 */
export function getEffectiveRegistrationModes(input: ContestantAppSettingsInput): Partial<RegistrationModeMatrix> {
  const served = servedEntityTypesOf(input);
  const effective: Partial<RegistrationModeMatrix> = {};
  for (const entityType of servedTypesOf(served)) {
    effective[entityType] = canonicalMembersOf(REGISTRATION_MODES, served[entityType]?.registrationModes);
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
  input: ContestantAppSettingsInput,
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
export function isRegistrationModeAllowedForAnyType(
  input: ContestantAppSettingsInput,
  mode: RegistrationMode
): boolean {
  return Object.values(getEffectiveRegistrationModes(input)).some((modes) => modes.includes(mode));
}

/**
 * The key of the name the Contestant App gives itself, which follows the entity types it serves.
 * @param input - The settings to read.
 */
export function getContestantAppNameKey(input: ContestantAppSettingsInput): ContestantAppNameKey {
  const served = getServedEntityTypes(input);
  const servesOrganizations = served.includes('organization');
  if (served.includes('candidate') && servesOrganizations) return 'candidateAndOrganization';
  return servesOrganizations ? 'organization' : 'candidate';
}

/**
 * A `servedEntityTypes` member as the accessors read it: a map keyed by served entity type.
 */
type ServedEntityTypeMap = NonNullable<
  NonNullable<NonNullable<ContestantAppSettingsInput>['contestantApp']>['servedEntityTypes']
>;

/**
 * The `servedEntityTypes` map in effect: the input's own when it has at least one key, the shipped default otherwise.
 * @param input - The settings to read.
 */
function servedEntityTypesOf(input: ContestantAppSettingsInput): ServedEntityTypeMap {
  const declared = input?.contestantApp?.servedEntityTypes;
  return declared && servedTypesOf(declared).length ? declared : dynamicSettings.contestantApp.servedEntityTypes;
}

/**
 * The keys of a `servedEntityTypes` map, in canonical order.
 * @param served - The map to read.
 */
function servedTypesOf(served: ServedEntityTypeMap): Array<ServedEntityType> {
  return canonicalMembersOf(SERVED_ENTITY_TYPES, Object.keys(served) as Array<ServedEntityType>);
}

/**
 * The members of `vocabulary` that `stored` lists, in the vocabulary's order and without repeats. An absent list reads as an empty one.
 * @param vocabulary - The values in canonical order.
 * @param stored - The values to canonicalise.
 */
export function canonicalMembersOf<TValue extends string>(
  vocabulary: ReadonlyArray<TValue>,
  stored: ReadonlyArray<TValue> | undefined
): Array<TValue> {
  return vocabulary.filter((value) => stored?.includes(value) ?? false);
}
