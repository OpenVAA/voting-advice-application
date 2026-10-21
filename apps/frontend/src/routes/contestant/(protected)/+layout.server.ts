/**
 * Load the data for a signed-in user of the Contestant App (server-side). Four stages decide who the user is and what they may edit:
 *
 * 1. **Session.** A request without a session is redirected to the login page.
 * 2. **User-level data.** `getBasicUserData()`, which carries whether the user's account has a password and the user's terms-of-use acceptance for this project. When it cannot be read, or does not say as a boolean whether the account has a password, the user is signed out and redirected to the login page with `loginFailed`: a fact that was not read is neither "set" nor "not set".
 * 3. **Gates.** `firstNeededGate(user)` decides, on the user-level data alone, whether the user must pass a gate: setting a password first, then accepting the terms of use. When one applies the load returns `{ gate, user }` and nothing below runs, so neither the entity list nor an entity is read for a gated user.
 * 4. **The entity list.** The entities the user edits and the application settings are read in parallel, and the list is filtered once to the entity types the project serves. This is the one place an entity of a type the project does not serve is dropped. A failed list read signs the user out with `loginFailed`. Whether the user has something to edit is decided by that list alone, never by the user's coarse role: the role summarises the grant shapes in the token for the app-entry gates, and the list is read from the database through the caller's own rights.
 *
 * The load returns one of two shapes, told apart by `gate`: `{ gate, user }` for a gated user, and `{ gate: null, user, entities }` otherwise, where `entities` is the list of the user's entities of the served types. Neither holds any part of the session. Which entity the user edits is read one level down, by the entity-level load, which awaits this one.
 *
 * The load reads the `entityType` and `entityId` route params on purpose, and uses neither value: reading them makes it rerun whenever the selected entity changes, including between the app root and an entity. Every decision made below it, the root's and the entity-level load's, is therefore made on a list read in the same request chain, so the two cannot disagree about what the user edits. It reads no other param, no `url` property and no `route`, so a navigation between the pages of one entity does not rerun it.
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
import { getLocale } from '$lib/paraglide/runtime';
import { buildRoute } from '$lib/routes';
import { signOutToLogin } from '$lib/server/contestant/signOutToLogin';
import type { DPDataType } from '$lib/api/base/dataTypes';

export async function load({ fetch, locals, params }) {
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

  // Stage 2: the user-level data, which is all the gates are decided on.
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

  // Stage 3: a gated user gets the gate and the user-level data only.
  const gate = firstNeededGate(user);
  if (gate !== null) return { gate, user };

  // Stage 4: the entity list, filtered to the served types.
  // This request's own provider instance, built over the same cookie-bearing client and likewise reachable from nowhere else.
  const dataProvider = createDataProvider({ fetch, locals });
  const [listed, appSettings] = await Promise.all([
    dataWriter.getUserEntities({ locale: lang }).catch((e) => {
      log.error(`Error listing the user's entities: ${e?.message ?? 'No error message'}`, { err: e });
      return undefined;
    }),
    // A failed settings read is logged and answered with empty settings, which the accessor reads as the shipped default of served types.
    dataProvider.getAppSettings().catch((e): DPDataType['appSettings'] => {
      log.error(`[Contestant App protected layout] Error reading app settings: ${e?.message ?? 'No error message'}`, {
        err: e
      });
      return {};
    })
  ]);
  if (!listed) return await signOutToLogin(locals, lang, 'loginFailed');
  const servedTypes = getServedEntityTypes(appSettings);
  const entities = listed.filter((entity) => servedTypes.includes(entity.type));

  return {
    gate: null,
    user,
    entities
  };
}
