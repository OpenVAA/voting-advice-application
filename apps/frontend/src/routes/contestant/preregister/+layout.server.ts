import { isRegistrationModeAllowed, log, REGISTRATION_MODE } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { createDataProvider, createSupabaseAnonClient } from '$lib/api/dataProvider';
import { getActiveProvider } from '$lib/api/utils/auth/providers';
import { COOKIE } from '$lib/cookies';
import { buildRoute } from '$lib/routes';
import type { DPDataType } from '$lib/api/base/dataTypes';

export async function load({ cookies, fetch, locals }) {
  // Whether candidates may pre-register is a stored setting, the `identity_provider` registration mode for candidates, so it is read at request time. The read goes through the DataProvider interface; this route does not touch Supabase itself.
  // The client is an explicitly anonymous one. No Supabase session exists at this point in the flow: the visitor is pre-registering and is authenticated only by the identity provider's `id_token` cookie below, so a cookie-capable client would carry no session to use. What an anonymous client may read of a project's settings is decided by the provider and the database, not here.
  const dataProvider = createDataProvider({ fetch, client: createSupabaseAnonClient({ fetch }) });

  // A failed read is logged and answered with empty settings. The accessor reads empty settings as the shipped defaults, which allow no registration mode, so the guard fails closed and redirects.
  const appSettings: DPDataType['appSettings'] = await dataProvider
    .getAppSettings()
    .catch((e): DPDataType['appSettings'] => {
      log.error(`[Contestant App preregister layout] Error reading app settings: ${e?.message ?? 'No error message'}`, {
        err: e
      });
      return {};
    });
  if (!isRegistrationModeAllowed(appSettings, 'candidate', REGISTRATION_MODE.IdentityProvider)) {
    return redirect(
      303,
      buildRoute({
        route: 'ContestantAppLogin',
        locale: locals.currentLocale
      })
    );
  }

  const idToken = cookies.get(COOKIE.idToken);

  if (!idToken) {
    return { claims: undefined };
  }

  const claims = await getActiveProvider().getIdTokenClaims(idToken);

  if (!claims.success) {
    cookies.delete(COOKIE.idToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });
    return { claims: undefined };
  }

  return { claims: { firstName: claims.data.firstName, lastName: claims.data.lastName } };
}
