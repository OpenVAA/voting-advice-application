import { log } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { createDataProvider, createSupabaseAnonClient } from '$lib/api/dataProvider';
import { getActiveProvider } from '$lib/api/utils/auth/providers';
import { COOKIE } from '$lib/cookies';
import { buildRoute } from '$lib/routes';
import type { DPDataType } from '$lib/api/base/dataTypes';

export async function load({ cookies, fetch, locals }) {
  // `preRegistration.enabled` is a DynamicSetting (backend/per-instance controlled, stored in the `app_settings` JSONB row), so it is read at request time rather than from build-time StaticSettings. The read goes through the DataProvider interface; this route does not touch Supabase itself (REVIEW-ADP-06).
  // Given an explicitly ANONYMOUS client on purpose, not a cookie-capable one. No Supabase session exists at this point in the flow -- the visitor is pre-registering and is authenticated only by the bank-auth `id_token` cookie below -- so a cookie-capable client would carry no session to use, and `app_settings` is readable by `anon` under the `anon_select_app_settings` policy. Handing the request-scoped client from `event.locals` to the adapter here would also reach back through the boundary this route was moved off by `157-16`, which the ESLint guard now enforces at this path. The client is now NAMED rather than defaulted, so the choice to run without a session is visible at the call site instead of being made by a fallback branch nobody selected.
  const dataProvider = createDataProvider({ fetch, client: createSupabaseAnonClient({ fetch }) });

  // Previously the raw `.select('settings')` discarded its `error` and fell through to the redirect below. That fail-closed behaviour is preserved deliberately, with the error now logged rather than silently dropped.
  const appSettings: DPDataType['appSettings'] = await dataProvider
    .getAppSettings()
    .catch((e): DPDataType['appSettings'] => {
      log.error(`[Candidate App preregister layout] Error reading app settings: ${e?.message ?? 'No error message'}`, {
        err: e
      });
      return {};
    });
  const preRegistrationEnabled = Boolean(appSettings.preRegistration?.enabled);

  if (!preRegistrationEnabled) {
    return redirect(
      303,
      buildRoute({
        route: 'CandAppLogin',
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
