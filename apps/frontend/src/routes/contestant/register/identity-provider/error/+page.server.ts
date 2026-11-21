import { oidcErrorClass } from '$lib/contestant/utils/oidcError';
import { isRegistrationOffered } from '$lib/server/contestant/registrationGuard';

/**
 * Decide on the server what the identity provider's error screen says: the class of its `error` parameter, and whether Try again is offered.
 *
 * The parameter is read once and mapped through the closed class table; its value is never returned, logged or otherwise passed on, so a crafted link can choose among three classes and nothing more. A value that is not a code is shown as `retry`.
 *
 * Try again is offered while the provider's mode is listed, as the registration guard answers for the need `identityProvider`: the settings are read anonymously at request time, and a failed read is logged and offers nothing. The page itself is served whatever the project offers: it reports a failure, a refused registration among them, and a refusal here would lose that report.
 */
export async function load({ fetch, url }) {
  const errorClass = oidcErrorClass(url.searchParams.get('error'));
  return { errorClass, providerOffered: await isRegistrationOffered({ fetch }, 'identityProvider') };
}
