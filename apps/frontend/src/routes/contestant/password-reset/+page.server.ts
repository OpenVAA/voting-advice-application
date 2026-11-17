import { redirect } from '@sveltejs/kit';
import { addressStateOf } from '$lib/contestant/utils/identityProviderAccount';
import { buildRoute } from '$lib/routes';

/**
 * Decide on the server whether the password-reset page is shown: to a signed-in user, whoever they are and however they arrived, and to nobody else.
 *
 * A request without a session, or with one the server could verify no user for, is redirected to the login page in the request's locale, with no parameter, so no part of the page's form reaches a visitor who cannot use it.
 *
 * The load decides by the session alone. It looks at nothing of the address it was asked for: a mailed link names a type when it is opened, and whoever holds the link can change that name, so it says nothing about what was asked for.
 *
 * It returns the address of the verified user under `email`, which the page shows and hands to its form, and nothing else. An account an identity provider made that holds only its placeholder address has no address of its own yet, so it gets none: the placeholder is never shown or handed to a password manager. No part of the session is returned: everything a server load returns is written into the page's markup.
 */
export async function load({ locals }) {
  const { session, user } = await locals.safeGetSession();
  if (!session || !user) redirect(303, buildRoute({ route: 'ContestantAppLogin', locale: locals.currentLocale }));
  const proved =
    addressStateOf({
      email: user.email,
      newEmail: user.new_email,
      identityProvider: user.app_metadata?.identity_provider
    }) === 'proved';
  return { email: proved ? user.email : undefined };
}
