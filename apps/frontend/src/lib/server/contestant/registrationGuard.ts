import { log, REGISTRATION_MODE } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { createDataProvider, createSupabaseAnonClient } from '$lib/api/dataProvider';
import { listedRegistrationModes } from '$lib/contestant/utils/registrationOffer';
import { buildRoute } from '$lib/routes';
import type { DPDataType } from '$lib/api/base/dataTypes';

/**
 * # The guard of the registration addresses
 *
 * The Contestant App's registration page, and the two screens a registration code leads to, are served only where the project offers what they are for. This module decides that on the server, for the server load of each of those pages and for the one form action among them.
 *
 * What registration offers is asked of `listedRegistrationModes`, the list the registration page itself shows, so a page is served exactly where another surface leads to it.
 *
 * The guard fails closed. The settings are read at request time, by this module, through a data provider on an explicitly anonymous client: it takes the settings it loaded itself, because a value handed in by its caller, or one read from the browser, could be a stale or a forged one, and because the anonymous read does not depend on who is signed in. A read that fails is logged and answered with empty settings, which list no mode, so the page is refused.
 *
 * Tested in `registrationGuard.test.ts`.
 */

/**
 * What a registration address needs of the project: `any` for the registration page, which needs at least one listed registration mode, `code` for the screens a registration code leads to, which need the code mode to be listed, and `identityProvider` for the identity provider's error screen, whose Try again needs the provider's mode to be listed.
 */
export type RegistrationNeed = 'any' | 'code' | 'identityProvider';

/** What the guard reads of a request: its fetch, and for the refusal its locale. */
type RegistrationGuardEvent = {
  fetch: typeof fetch;
  locals: Pick<App.Locals, 'currentLocale'>;
};

/**
 * Whether the project offers what a registration address needs.
 *
 * Reads the application settings once on every call, so a setting that was changed is honoured at the next request. Never rejects: a failed read is logged and answered with `false`.
 * @param event - The request, of which the fetch alone is read.
 * @param need - What the address needs.
 * @returns `true` when at least one registration mode is listed, for the need `any`, when the code mode is listed, for the need `code`, or when the provider's mode is listed, for the need `identityProvider`.
 */
export async function isRegistrationOffered(
  { fetch }: Pick<RegistrationGuardEvent, 'fetch'>,
  need: RegistrationNeed
): Promise<boolean> {
  const dataProvider = createDataProvider({ fetch, client: createSupabaseAnonClient({ fetch }) });
  const appSettings: DPDataType['appSettings'] = await dataProvider
    .getAppSettings()
    .catch((e): DPDataType['appSettings'] => {
      log.error(`[Contestant App registration guard] Error reading app settings: ${e?.message ?? 'No error message'}`, {
        err: e
      });
      return {};
    });
  const listed = listedRegistrationModes(appSettings);
  if (need === 'code') return listed.includes(REGISTRATION_MODE.Code);
  if (need === 'identityProvider') return listed.includes(REGISTRATION_MODE.IdentityProvider);
  return listed.length > 0;
}

/**
 * Serve a registration address only where the project offers what it needs, and lead to the login page otherwise.
 *
 * The redirect is built from the login page's route key and the request's locale. It carries no parameter, and nothing of it is taken from the request.
 * @param event - The request, of which the fetch and the locale are read.
 * @param need - What the address needs.
 * @returns Nothing when the address is served.
 * @throws SvelteKit's 303 redirect to the Contestant App's login page when it is not.
 */
export async function refuseUnlessRegistrationOffered(
  event: RegistrationGuardEvent,
  need: RegistrationNeed
): Promise<void> {
  if (await isRegistrationOffered(event, need)) return;
  redirect(303, buildRoute({ route: 'ContestantAppLogin', locale: event.locals.currentLocale }));
}
