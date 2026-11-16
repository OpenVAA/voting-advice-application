/**
 * Decide whether an entity's preview is served (server-side). It decides, in order:
 *
 * 1. **The parent.** The parent loads' data, awaited before anything else. While a user-level gate is pending the load returns an empty object, reads nothing and redirects nowhere, so the gate's view is shown at the URL the user asked for.
 * 2. **No entity data.** When the parent's data holds no entity the load returns an empty object, and the entity layout shows its own error view at the URL the user asked for.
 * 3. **The rule.** `isPreviewOpen` answers from the entity and the question data the parent loads read in this request, and from the election and constituency data it reads through a provider built over this request's client.
 * 4. **A closed preview.** The entity is redirected to its own home, which says what is missing.
 * 5. **An open preview, or no answer.** The load returns an empty object and the page is served. `isPreviewOpen` gives no answer when the question data is not usable, when the elections or the constituencies cannot be read, or when a nomination names an election or a constituency that was not read. Nothing is redirected then. Question data that is not usable is also the entity layout's own error view, shown in the page's place. In the other two cases the entity layout's data is valid, so the preview is served and no error view is shown.
 *
 * The load never signs anyone out. It trusts nothing the browser sends: the answer rests on rows the server read in this request, by the rule the browser's task state follows. The target is built with `buildRoute` from a route key and the two params the route's matchers admitted, so nothing of the requested path reaches it.
 *
 * The load takes `fetch`, `locals`, `params` and `parent` from the request event and nothing else. It reads the `entityType` and `entityId` params alone, and no `url` property and no `route`.
 *
 * The rule is asked here, in the page's own load, because a page's load runs on every arrival at the page, and its `await parent()` runs the parent loads again on the server in that request. It therefore sees an answer saved in the browser a moment before, where a layout's load does not run again on a navigation between two pages below it.
 */

import { redirect } from '@sveltejs/kit';
import { createDataProvider } from '$lib/api/dataProvider';
import { getLocale } from '$lib/paraglide/runtime';
import { buildRoute } from '$lib/routes';
import { isPreviewOpen } from '$lib/server/contestant/previewGate';

export async function load({ fetch, locals, params, parent }) {
  const parentData = await parent();
  if (parentData.gate !== null) return {};

  const { contestantUserData, questionData } = parentData;
  if (!contestantUserData) return {};

  const locale = getLocale();
  // This request's own provider instance, built over the cookie-bearing client `hooks.server.ts` built for this request and reachable from nowhere else.
  const dataProvider = createDataProvider({ fetch, locals });

  const open = await isPreviewOpen({ dataProvider, locale, userData: contestantUserData, questionData });
  if (open === false)
    redirect(
      307,
      buildRoute({
        route: 'ContestantAppEntityHome',
        locale,
        entityType: params.entityType,
        entityId: params.entityId
      })
    );

  return {};
}
