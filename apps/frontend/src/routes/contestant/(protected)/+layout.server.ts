/**
 * Load the data for a signed-in user of the Contestant App (server-side). Four stages decide who the user is and what they may edit:
 *
 * 1. **Session.** A request without a session is redirected to the login page.
 * 2. **User-level data.** `getBasicUserData()`, which carries whether the user's account has a password, the state of its address, whether the identity's own party still has no name, and the user's terms-of-use acceptance for this project. When it cannot be read, or does not say as a boolean whether the account has a password, the user is signed out and redirected to the login page with `loginFailed`: a fact that was not read is neither "set" nor "not set". The application settings are read next, once: a failed read is logged and answered with empty settings, which read as the shipped defaults.
 * 3. **Gates.** `firstNeededGate` decides, on the user-level data and two facts of the request, whether the user must pass a gate: setting a password, then what an identity provider's account still lacks, then accepting the terms of use. The two facts are the identity provider's arrival marker, read from its cookie, and whether answers are locked, read from the settings. When a gate applies the load returns `{ gate, user, arrival }` and nothing below runs, so neither the entity list nor an entity is read for a gated user.
 * 4. **The entity list.** The entities the user edits are read and filtered once to the entity types the settings say the project serves. This is the one place an entity of a type the project does not serve is dropped. A failed list read, whether on a schema mismatch, a network error or a server error, is logged and answered with an empty list and `entitiesReadFailed: true`: nobody is signed out, the root page shows the read-failure view, and a request for an entity is sent to the root by the entity-level load as one for an entity the list does not hold is. Whether the user has something to edit is decided by that list alone, never by the user's coarse role: the role summarises the grant shapes in the token for the app-entry gates, and the list is read from the database through the caller's own rights.
 *
 * The load returns one of two shapes, told apart by `gate`: `{ gate, user, arrival }` for a gated user, and `{ gate: null, user, entities }` otherwise, where `entities` is the list of the user's entities of the served types; when that list could not be read it is empty and the shape also holds `entitiesReadFailed: true`. Neither holds any part of the session. Which entity the user edits is read one level down, by the entity-level load, which awaits this one.
 *
 * The load reads the `entityType` and `entityId` route params on purpose, and uses neither value: reading them makes it rerun whenever the selected entity changes, including between the app root and an entity. Every decision made below it, the root's and the entity-level load's, is therefore made on a list read in the same request chain, so the two cannot disagree about what the user edits. It reads no other param, no `url` property and no `route`, so a navigation between the pages of one entity does not rerun it. The arrival marker comes from a cookie, never from the URL, and a cookie read is not a dependency SvelteKit tracks.
 *
 * Every sign-out goes through `signOutToLogin()`.
 *
 * Every authenticated call runs on `event.locals.supabase`, the server client built over this request's session cookies.
 */

import { getServedEntityTypes, log } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { firstNeededGate } from '$contestant/gates/gates';
import { createDataProvider } from '$lib/api/dataProvider';
import { createDataWriter } from '$lib/api/dataWriter';
import { COOKIE } from '$lib/cookies';
import { getLocale } from '$lib/paraglide/runtime';
import { buildRoute } from '$lib/routes';
import { signOutToLogin } from '$lib/server/contestant/signOutToLogin';
import type { Cookies } from '@sveltejs/kit';
import type { IdentityProviderArrival } from '$contestant/gates/gates';
import type { DPDataType } from '$lib/api/base/dataTypes';
import type { UserEntity } from '$lib/api/base/dataWriter.type';

export async function load({ cookies, fetch, locals, params }) {
  // Read for the dependency alone: the load reruns when the selected entity changes.
  void params.entityType;
  void params.entityId;

  const lang = getLocale();

  // A writer this request alone holds, over the cookie-bearing client `hooks.server.ts` built for this request, so the authenticated calls below run on THIS user's session cookies and cannot be rebound by a concurrent request.
  const dataWriter = createDataWriter({ fetch, locals });

  // Stage 1: the session.
  const { session } = await locals.safeGetSession();
  if (!session)
    return redirect(
      307,
      buildRoute({
        route: 'ContestantAppLogin',
        locale: lang
      })
    );

  // Stage 2: the user-level data, which the gates are decided on with two facts of the request.
  const user = await dataWriter.getBasicUserData().catch((e) => {
    log.error(`Error fetching basic user data: ${e?.message ?? 'No error message'}`, { err: e });
    return undefined;
  });
  if (!user) return await signOutToLogin(locals, lang, 'loginFailed');
  // The gates are asked only about a user whose password fact was read.
  if (typeof user.passwordSet !== 'boolean') {
    log.error('The user-level data does not say whether the account has a password.');
    return await signOutToLogin(locals, lang, 'loginFailed');
  }

  // The settings are read once, before the gates, which read the answers lock from them; the entity list's served types come from the same read.
  // This request's own provider instance, built over the same cookie-bearing client and likewise reachable from nowhere else.
  const dataProvider = createDataProvider({ fetch, locals });
  // A failed settings read is logged and answered with empty settings, which the accessors read as the shipped defaults: answers unlocked, the default served types.
  const appSettings = await dataProvider.getAppSettings().catch((e): DPDataType['appSettings'] => {
    log.error(`[Contestant App protected layout] Error reading app settings: ${e?.message ?? 'No error message'}`, {
      err: e
    });
    return {};
  });

  // Stage 3: a gated user gets the gate, the user-level data and the arrival marker only.
  const arrival = arrivalOf(cookies);
  const gate = firstNeededGate({ user, arrival, answersLocked: appSettings.access?.answersLocked === true });
  if (gate !== null) return { gate, user, arrival };

  // Stage 4: the entity list, filtered to the served types.
  const listed = await dataWriter.getUserEntities({ locale: lang }).catch((e) => {
    log.error(`Error listing the user's entities: ${e?.message ?? 'No error message'}`, { err: e });
    return undefined;
  });
  if (!listed) return { gate: null, user, entities: new Array<UserEntity>(), entitiesReadFailed: true as const };
  const servedTypes = getServedEntityTypes(appSettings);
  const entities = listed.filter((entity) => servedTypes.includes(entity.type));

  return {
    gate: null,
    user,
    entities
  };
}

/**
 * The identity provider's arrival marker as this request carries it: `created` or `existing`, and `null` for an absent cookie or any other value.
 * @param cookies - The request's cookies.
 * @returns The marker.
 */
function arrivalOf(cookies: Cookies): IdentityProviderArrival {
  const value = cookies.get(COOKIE.identityProviderArrival);
  return value === 'created' || value === 'existing' ? value : null;
}
