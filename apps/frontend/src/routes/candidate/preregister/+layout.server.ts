import { redirect } from '@sveltejs/kit';
import { getIdTokenClaims } from '$lib/api/utils/auth/getIdTokenClaims';
import { buildRoute } from '$lib/utils/route';

export async function load({ cookies, locals }) {
  // `preRegistration.enabled` is a DynamicSetting (backend/per-instance controlled,
  // stored in the `app_settings` JSONB row) — read it server-side via the request's
  // Supabase client rather than from build-time StaticSettings.
  const { data: appSettingsRow } = await locals.supabase.from('app_settings').select('settings').limit(1).maybeSingle();
  const preRegistrationEnabled = Boolean(
    (appSettingsRow?.settings as { preRegistration?: { enabled?: boolean } } | null)?.preRegistration?.enabled
  );

  if (!preRegistrationEnabled) {
    return redirect(
      303,
      buildRoute({
        route: 'CandAppLogin',
        locale: locals.currentLocale
      })
    );
  }

  const idToken = cookies.get('id_token');

  if (!idToken) {
    return { claims: undefined };
  }

  const claims = await getIdTokenClaims(idToken);

  if (!claims.success) {
    cookies.delete('id_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/'
    });
    return { claims: undefined };
  }

  return { claims: { firstName: claims.data.firstName, lastName: claims.data.lastName } };
}
