import { log, REGISTRATION_MODE } from '@openvaa/app-shared';
import { createDataProvider, createSupabaseAnonClient } from '$lib/api/dataProvider';
import { oidcErrorClass } from '$lib/contestant/utils/oidcError';
import { listedRegistrationModes } from '$lib/contestant/utils/registrationOffer';
import type { DPDataType } from '$lib/api/base/dataTypes';

/**
 * Decide on the server what the identity provider's error screen says: the class of its `error` parameter, and whether Try again is offered.
 *
 * The parameter is read once and mapped through the closed class table; its value is never returned, logged or otherwise passed on, so a crafted link can choose among three classes and nothing more. A value that is not a code is shown as `retry`.
 *
 * Try again is offered while the provider's mode is listed. The settings are read anonymously at request time, and a failed read is logged and answered with empty settings, which offer nothing. The page itself is served whatever the project offers: it reports a failure, a refused registration among them, and a refusal here would lose that report.
 */
export async function load({ fetch, url }) {
  const errorClass = oidcErrorClass(url.searchParams.get('error'));
  const dataProvider = createDataProvider({ fetch, client: createSupabaseAnonClient({ fetch }) });
  const appSettings: DPDataType['appSettings'] = await dataProvider
    .getAppSettings()
    .catch((e): DPDataType['appSettings'] => {
      log.error(
        `[Contestant App identity provider error] Error reading app settings: ${e?.message ?? 'No error message'}`,
        { err: e }
      );
      return {};
    });
  return {
    errorClass,
    providerOffered: listedRegistrationModes(appSettings).includes(REGISTRATION_MODE.IdentityProvider)
  };
}
