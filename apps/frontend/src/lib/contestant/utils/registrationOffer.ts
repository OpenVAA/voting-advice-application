import { isRegistrationModeAllowed, isRegistrationModeAllowedForAnyType, REGISTRATION_MODE } from '@openvaa/app-shared';
import type { ContestantAppConfigInput, RegistrationMode } from '@openvaa/app-shared';

/**
 * What the Contestant App offers a visitor who is not signed in, read from the application settings.
 *
 * Both functions are plain and synchronous: they take the settings as their argument and read no context, so a component passes the settings its context holds and a server load passes the settings it loaded, and the two reach one answer.
 *
 * Tested in `registrationOffer.test.ts`.
 */

/**
 * The settings this module reads: the Contestant App's served entity types and registration modes, and the answers lock. The merged application settings, the stored settings as a data provider returns them and `{}` are all valid, and an absent member reads as its shipped default.
 */
export type RegistrationOfferSettings =
  (NonNullable<ContestantAppConfigInput> & { access?: { answersLocked?: boolean | null } | null }) | null | undefined;

/**
 * The registration modes a visitor is offered, in the order they are listed: the identity provider, then email, then code, each at most once whatever order the settings store them in.
 *
 * Every surface that offers registration asks this function, so that none of them can lead to another that refuses: the login screen's registration entry, the options of the registration screen, the menu's registration item and the guard of the registration routes. An empty list means that nothing offers registration.
 *
 * The identity provider's mode is asked for candidates only, because registering through the provider creates a candidate. A project whose only allowed mode is the provider's, for organizations alone, therefore lists nothing, although its settings do allow a mode. The email and code modes are listed when any served entity type allows them, because the invitation they redeem names its own entity.
 *
 * While answers are locked nothing is listed.
 * @param settings - The application settings to read.
 * @returns The offered modes in listing order. Empty when registration is not offered.
 */
export function listedRegistrationModes(settings: RegistrationOfferSettings): ReadonlyArray<RegistrationMode> {
  if (settings?.access?.answersLocked) return [];
  const listed = new Array<RegistrationMode>();
  if (isRegistrationModeAllowed(settings, 'candidate', REGISTRATION_MODE.IdentityProvider))
    listed.push(REGISTRATION_MODE.IdentityProvider);
  if (isRegistrationModeAllowedForAnyType(settings, REGISTRATION_MODE.Email)) listed.push(REGISTRATION_MODE.Email);
  if (isRegistrationModeAllowedForAnyType(settings, REGISTRATION_MODE.Code)) listed.push(REGISTRATION_MODE.Code);
  return listed;
}

/**
 * Whether the sign-in form offers to mail a sign-in link: the email mode or the identity provider's mode is allowed for at least one served entity type. An account made under either may have no password yet.
 *
 * The answers lock is not read: a user who cannot edit can still sign in.
 * @param settings - The application settings to read.
 */
export function signInLinkOffered(settings: RegistrationOfferSettings): boolean {
  return (
    isRegistrationModeAllowedForAnyType(settings, REGISTRATION_MODE.Email) ||
    isRegistrationModeAllowedForAnyType(settings, REGISTRATION_MODE.IdentityProvider)
  );
}
