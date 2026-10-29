import { staticSettings } from '@openvaa/app-shared';
import { json } from '@sveltejs/kit';
import { createDataProvider } from '$lib/api/dataProvider';
import { createDataWriter } from '$lib/api/dataWriter';
import { COOKIE } from '$lib/cookies';
import { handleIdentityProviderRegistration } from '$lib/server/contestant/identityProviderRegistration';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * The endpoint where a signed-in identity-provider account saves its party's names and the address it gives, asks for the address's link again, and clears the arrival marker. What each intent does, and what it never answers, is described in `$lib/server/contestant/identityProviderRegistration.ts`; this route only builds the request's effects.
 *
 * Every effect runs on this request's own client, so the writes are the signed-in user's own and row-level security decides them. The caller is the user `safeGetSession` verified.
 *
 * @returns A JSON `Response` whose body holds one result.
 */
export async function POST({ request, locals, cookies, fetch, url }: RequestEvent): Promise<Response> {
  const writer = createDataWriter({ fetch, locals });
  const { status, body } = await handleIdentityProviderRegistration(request, {
    origin: url.origin,
    projectId: writer.projectId,
    defaultLocale: writer.defaultLocale,
    locale: locals.currentLocale,
    supportedLocales: staticSettings.supportedLocales.map(({ code }) => code),
    getVerifiedUser: async () => {
      const { session, user } = await locals.safeGetSession();
      return session && user ? { appMetadata: user.app_metadata } : null;
    },
    // Read through this request's own provider, as the protected layout reads it. A failed read rejects, and the endpoint answers `failed` rather than write past a lock it could not read.
    getAnswersLocked: async () =>
      (await createDataProvider({ fetch, locals }).getAppSettings()).access?.answersLocked === true,
    getBasicUserData: () => writer.getBasicUserData(),
    getUserEntities: () => writer.getUserEntities(),
    updateEntityProperties: (opts) => writer.updateEntityProperties(opts),
    requestAddressConfirmation: (opts) => writer.requestAddressConfirmation(opts),
    deleteArrivalMarker: () => cookies.delete(COOKIE.identityProviderArrival, { path: '/' })
  });
  return json(body, { status });
}
