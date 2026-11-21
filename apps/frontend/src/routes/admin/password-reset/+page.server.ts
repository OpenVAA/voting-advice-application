import { redirect } from '@sveltejs/kit';
import { addressStateOf } from '$lib/contestant/utils/identityProviderAccount';
import { buildRoute } from '$lib/routes';

/**
 * Decide on the server whether the Admin App's password-reset page is shown: to a signed-in user, whoever they are and however they arrived, and to nobody else.
 *
 * A request without a session, or with one the server could verify no user for, is redirected to the Admin App's login page in the request's locale, with no parameter, so no part of the page's form reaches a visitor who cannot use it.
 *
 * The load decides by the session alone, read through `locals.safeGetSession()`. It looks at nothing of the address it was asked for: whoever holds a mailed link can change what it names.
 *
 * It returns the address of the verified user under `email`, which the page shows and hands to its form, and nothing else. An account an identity provider made that holds only its placeholder address gets none. No part of the session is returned: everything a server load returns is written into the page's markup.
 */
export async function load({ locals }) {
  const { session, user } = await locals.safeGetSession();
  if (!session || !user) redirect(303, buildRoute({ route: 'AdminAppLogin', locale: locals.currentLocale }));
  const proved =
    addressStateOf({
      email: user.email,
      newEmail: user.new_email,
      identityProvider: user.app_metadata?.identity_provider
    }) === 'proved';
  return { email: proved ? user.email : undefined };
}
