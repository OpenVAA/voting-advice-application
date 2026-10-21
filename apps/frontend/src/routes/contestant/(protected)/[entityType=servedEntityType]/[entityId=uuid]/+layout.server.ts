/**
 * Load the entity the URL names for a signed-in user of the Contestant App (server-side). It reads, in order:
 *
 * 1. **The parent.** The user-level load's `gate` and `entities`, awaited before anything else. While a gate is pending the load returns an empty object and reads nothing, so a gated user's entity is never read.
 * 2. **Membership.** The entity named by the `entityType` and `entityId` route params must be in the user's served list. When it is not, the user is redirected to the app root and no entity is read.
 * 3. **The entity.** The listed entity, with its nominations, in the locale of the request. When the read finds no entity, or is refused the entity's nominations, the user is redirected to the app root; when the read fails the user is signed out with `loginFailed`.
 * 4. **The questions.** The question data of the elections the entity is nominated in, in the same locale. An entity with no nomination is asked no question: none is read for it, and it is served with question data that holds no category and no question.
 *
 * The load returns `{ questionData, contestantUserData }`, where `questionData` is the error itself when the question read fails.
 *
 * The URL never decides what is served: the user's own list does, and the read that follows runs on the user's own rights. Every refusal of an entity the user may not edit is the same redirect, with the same status and the same target, whether the entity is another user's, of a type the project does not serve, named under the wrong type, no longer listed or not found. Nobody is signed out over one, and nothing in the answer differs by whether the id exists.
 *
 * The load reads the `entityType` and `entityId` route params and no other, no `url` property and no `route`, so it reruns when the selected entity changes and not on a navigation between the pages of one entity. It takes `fetch`, `locals`, `params` and `parent` from the request event and nothing else. Every sign-out goes through `signOutToLogin()`.
 *
 * Every authenticated call runs on `event.locals.supabase`, the server client built over this request's session cookies.
 */

import { log } from '@openvaa/app-shared';
import { redirect } from '@sveltejs/kit';
import { createDataProvider } from '$lib/api/dataProvider';
import { createDataWriter } from '$lib/api/dataWriter';
import { hasNomination } from '$lib/contestant/tasks';
import { getLocale } from '$lib/paraglide/runtime';
import { buildRoute } from '$lib/routes';
import { signOutToLogin } from '$lib/server/contestant/signOutToLogin';
import { removeDuplicates } from '$lib/utils/removeDuplicates';

export async function load({ fetch, locals, params, parent }) {
  // Stage 1: the parent, which decides whether an entity is read at all.
  const parentData = await parent();
  if (parentData.gate !== null) return {};
  const { entities } = parentData;

  // The two params that name the entity, and the load's only param reads.
  const { entityType, entityId } = params;

  const lang = getLocale();
  /** Where every refusal of an entity the user may not edit leads. */
  const appRoot = buildRoute({ route: 'ContestantAppHome', locale: lang });

  // Stage 2: the entity the URL names must be one the user is listed with.
  const listed = entities.find((entity) => entity.type === entityType && entity.id === entityId);
  if (!listed) redirect(307, appRoot);

  // A writer this request alone holds, over the cookie-bearing client `hooks.server.ts` built for this request, so the authenticated read below runs on THIS user's session cookies and cannot be rebound by a concurrent request.
  const dataWriter = createDataWriter({ fetch, locals });

  // Stage 3: the entity. No row and a failed read are different facts at the writer, and different outcomes here.
  const read = await dataWriter
    .getEntityUserData({ type: listed.type, id: listed.id, loadNominations: true, locale: lang })
    .then((value) => ({ failed: false as const, value }))
    .catch((e) => {
      log.error(`Error fetching user data: ${e?.message ?? 'No error message'}`, { err: e });
      return { failed: true as const };
    });
  if (read.failed) return await signOutToLogin(locals, lang, 'loginFailed');
  const userData = read.value;
  if (!userData) redirect(307, appRoot);

  // Stage 4: the questions. An entity with no nomination has no election to scope a question read by, so none is made and no question of the project is served to it.
  const { nominations } = userData;
  if (!hasNomination(nominations)) {
    return { questionData: { categories: [], questions: [] }, contestantUserData: userData };
  }
  const electionId = removeDuplicates(nominations.map((n) => n.electionId));

  // This request's own provider instance, built over the same cookie-bearing client and likewise reachable from nowhere else.
  const dataProvider = createDataProvider({ fetch, locals });
  // Awaited, so that the load returns no promise for SvelteKit to stream.
  const questionData = await dataProvider.getQuestionData({ electionId, locale: lang }).catch((e) => e);

  return {
    questionData,
    contestantUserData: userData
  };
}
