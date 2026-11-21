import {
  getServedEntityTypes,
  isRegistrationModeAllowed,
  isRegistrationModeAllowedForAnyType,
  isRegistrationModeServedForAnyType,
  REGISTRATION_MODE
} from '@openvaa/app-shared';
import type { ContestantAppSettingsInput, RegistrationMode, ServedEntityType } from '@openvaa/app-shared';

/**
 * What the Contestant App offers a visitor who is not signed in, read from the application settings.
 *
 * Every function is plain and synchronous: they take the settings as their argument and read no context, so a component passes the settings its context holds and a server load passes the settings it loaded, and the two reach one answer.
 *
 * Tested in `registrationOffer.test.ts`.
 */

/**
 * The settings this module reads: the Contestant App's served entity types and registration modes, `access.contestantApp` and `access.contestantEditing`. The merged application settings, the stored settings as a data provider returns them and `{}` are all valid, and an absent member reads as its shipped default.
 */
export type RegistrationOfferSettings = ContestantAppSettingsInput;

/**
 * The registration modes a visitor is offered, in the order they are listed: the identity provider, then email, then code, each at most once whatever order the settings store them in.
 *
 * Every surface that offers registration asks this function, so that none of them can lead to another that refuses: the login screen's registration entry, the options of the registration screen, the menu's registration item and the guard of the registration routes. An empty list means that nothing offers registration.
 *
 * Each mode is listed when any served entity type allows it. Registering through the identity provider creates an entity of a type the user chooses among those {@link identityProviderEntityTypes} answers, and the invitation the email and code modes redeem names its own entity.
 *
 * While `access.contestantEditing` is `locked` nothing is listed, as `isRegistrationModeAllowed` answers. The database applies the same rule: `private.registration_mode_allowed` is false while contestant editing is `locked`, so an invitation is neither claimed nor answered with a link then, whichever form the address or code is typed into.
 *
 * While `access.contestantApp` is `false` nothing is listed either, as {@link contestantAppClosed} answers: the database closes every registration of a candidate or an organization while the Contestant App is closed.
 * @param settings - The application settings to read.
 * @returns The offered modes in listing order. Empty when registration is not offered.
 */
export function listedRegistrationModes(settings: RegistrationOfferSettings): ReadonlyArray<RegistrationMode> {
  if (contestantAppClosed(settings)) return [];
  const listed = new Array<RegistrationMode>();
  if (isRegistrationModeAllowedForAnyType(settings, REGISTRATION_MODE.IdentityProvider))
    listed.push(REGISTRATION_MODE.IdentityProvider);
  if (isRegistrationModeAllowedForAnyType(settings, REGISTRATION_MODE.Email)) listed.push(REGISTRATION_MODE.Email);
  if (isRegistrationModeAllowedForAnyType(settings, REGISTRATION_MODE.Code)) listed.push(REGISTRATION_MODE.Code);
  return listed;
}

/**
 * The entity types a registration through the identity provider may create: the served types whose registration modes include the provider's mode, in the order candidate, organization.
 *
 * The registration screen asks the user to choose among them when there are several and names the one when there is one, and the endpoint that starts the provider's flow accepts a type only from this list. The provider's mode is listed by {@link listedRegistrationModes} exactly when this list is not empty.
 *
 * While `access.contestantEditing` is `locked` the list is empty, as `isRegistrationModeAllowed` answers, and so it is while `access.contestantApp` is `false`, as {@link contestantAppClosed} answers.
 * @param settings - The application settings to read.
 * @returns The types in canonical order. Empty when the provider's mode registers nothing.
 */
export function identityProviderEntityTypes(settings: RegistrationOfferSettings): ReadonlyArray<ServedEntityType> {
  if (contestantAppClosed(settings)) return [];
  return getServedEntityTypes(settings).filter((entityType) =>
    isRegistrationModeAllowed(settings, entityType, REGISTRATION_MODE.IdentityProvider)
  );
}

/**
 * The entity type a registration through the identity provider creates: a named type when {@link identityProviderEntityTypes} lists it, and with no type named the one type that list holds.
 *
 * The endpoint that starts the provider's flow and the callback the provider returns to both decide the type here, so a type the start refused is refused on return too, and every type is refused while `access.contestantEditing` is `locked` or `access.contestantApp` is `false`.
 * @param settings - The application settings to read.
 * @param named - The type a request or the flow's cookie names, as sent; `undefined` when none is named.
 * @returns The type, or `undefined` when the registration is refused.
 */
export function identityProviderEntityType(
  settings: RegistrationOfferSettings,
  named: unknown
): ServedEntityType | undefined {
  const allowing = identityProviderEntityTypes(settings);
  if (named === undefined) return allowing.length === 1 ? allowing[0] : undefined;
  return allowing.find((type) => type === named);
}

/**
 * Whether the sign-in form offers to mail a sign-in link: the email mode or the identity provider's mode is served for at least one entity type. An account made under either may have no password yet.
 *
 * `access.contestantEditing` is not read: a user who cannot edit can still sign in. A link the form requests while contestant editing is `locked` reaches only an address that already holds a grant in the project, because the database answers no open invitation then.
 * @param settings - The application settings to read.
 */
export function signInLinkOffered(settings: RegistrationOfferSettings): boolean {
  return (
    isRegistrationModeServedForAnyType(settings, REGISTRATION_MODE.Email) ||
    isRegistrationModeServedForAnyType(settings, REGISTRATION_MODE.IdentityProvider)
  );
}

/**
 * Whether the Contestant App is closed: `access.contestantApp` is stored as `false`. An absent or `null` value reads as open, the shipped default.
 *
 * Kept apart from `isRegistrationModeAllowed`, which states the rule of `private.registration_mode_allowed_in` alone. The database closes registration of a closed app in `private.project_contestant_app_closed`.
 * @param settings - The application settings to read.
 */
function contestantAppClosed(settings: RegistrationOfferSettings): boolean {
  return settings?.access?.contestantApp === false;
}
