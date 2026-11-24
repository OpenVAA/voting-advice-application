/**
 * Resolve a request for an entity page of the Contestant App that names no entity, such as `/contestant/profile` or `/contestant/questions/<questionId>` (server-side). The route's matcher admits exactly the entity sub-paths the app has, so any other path under the app is not served here.
 *
 * 1. **The parent.** The user-level load's `gate` and `entities`, awaited before anything else. While a gate is pending the load returns an empty object and redirects nowhere, so the gate's view is shown at the URL the user asked for.
 * 2. **Exactly one entity.** The user is redirected to the same page under that entity.
 * 3. **Any other number of entities, or a list that could not be read.** The user is redirected to the app root, which decides what such a user sees.
 *
 * The load never signs anyone out. Every target is built with `buildRoute` from a route key and the page `entityPageOf` resolves, so nothing of the requested path reaches the target unchecked; a sub-path it resolves to no page, which the matcher already rejects, leads to the app root.
 *
 * The load takes `params` and `parent` from the request event and nothing else. It reads the `page` param alone, and no `url` property and no `route`, so the query string of the request is not carried over.
 */

import { redirect } from '@sveltejs/kit';
import { getLocale } from '$lib/paraglide/runtime';
import { buildRoute, entityPageOf } from '$lib/routes';

export async function load({ params, parent }) {
  const parentData = await parent();
  if (parentData.gate !== null) return {};
  const { entities } = parentData;

  const lang = getLocale();
  const appRoot = buildRoute({ route: 'ContestantAppHome', locale: lang });

  if (entities === null || entities.length !== 1) redirect(307, appRoot);
  const [{ type, id }] = entities;

  const entityPage = entityPageOf(params.page);
  if (!entityPage) redirect(307, appRoot);

  redirect(
    307,
    buildRoute({
      ...entityPage,
      locale: lang,
      entityType: type,
      entityId: id
    })
  );
}
