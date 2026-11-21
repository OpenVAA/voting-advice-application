/**
 * Decide whether the pages an entity needs a nomination for are served: the profile, the questions with each question's page, and the preview (server-side). It decides, in order:
 *
 * 1. **The parent.** The parent loads' data, awaited before anything else. While a user-level gate is pending the load returns an empty object and redirects nowhere, so the gate's view is shown at the URL the user asked for.
 * 2. **No entity data.** When the parent's data holds no list of the entity's nominations the load returns an empty object, and the entity layout shows its own error view at the URL the user asked for.
 * 3. **No nomination.** An entity whose list is empty is redirected to its own home, which says what is missing. No page of the group is served to it.
 * 4. **A nomination.** The load returns an empty object and the page asked for is served. One nomination is enough, confirmed or not.
 *
 * The load never signs anyone out. The answer rests on the rows the parent loads read on the server in this request, by the predicate the entity-level load and the browser's task state ask. The target is built with `buildRoute` from a route key and the two params the route's matchers admitted, so nothing of the requested path reaches it.
 *
 * The load takes `params` and `parent` from the request event and nothing else. It reads the `entityType` and `entityId` params alone, and no `url` property and no `route`, so it runs once per entry to the group and not again on a navigation between two pages of the group. A rule that must be asked on every arrival at one page, such as the preview's own, therefore belongs to that page's load and not here.
 */

import { redirect } from '@sveltejs/kit';
import { hasNomination } from '$lib/contestant/tasks';
import { getLocale } from '$lib/paraglide/runtime';
import { buildRoute } from '$lib/routes';

export async function load({ params, parent }) {
  const parentData = await parent();
  if (parentData.gate !== null) return {};

  const nominations = parentData.contestantUserData?.nominations;
  if (!nominations) return {};

  if (!hasNomination(nominations))
    redirect(
      307,
      buildRoute({
        route: 'ContestantAppEntityHome',
        locale: getLocale(),
        entityType: params.entityType,
        entityId: params.entityId
      })
    );

  return {};
}
