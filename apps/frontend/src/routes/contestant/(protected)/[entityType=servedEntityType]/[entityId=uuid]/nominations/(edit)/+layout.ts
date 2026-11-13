/**
 * Decide whether the nomination editor is served to the entity the URL names: its election step, its constituency step and its details step (universal). It decides, in order:
 *
 * 1. **The parent.** The parent loads' data, awaited before anything else. While a user-level gate is pending the load returns an empty object and redirects nowhere, so the gate's view is shown at the URL the user asked for.
 * 2. **No facts.** When the parent's data holds no facts of the entity's nominations the load returns an empty object, and the layout above shows its own error view.
 * 3. **Not editable.** While either lock is on, the user is redirected to the nominations view, which says why.
 * 4. **No admissible election.** When no election admits the entity's type, the user is redirected to the nominations view, which says so.
 * 5. **Otherwise** the load returns an empty object and the step asked for is served, to an entity that has nominations as to one that has none.
 *
 * Every redirect is the same one, with status 307 and the nominations view of the entity as its target. It carries no notice and no query parameter: the view is the explanation. The target is built with `buildRoute` from a route key and the two params the route's matchers admitted, so nothing of the requested path reaches it.
 *
 * The load takes `params` and `parent` from the event and nothing else. It reads the `entityType` and `entityId` params alone, and no `url` property and no `route`, so it runs once per entry to the editor and not again on a navigation between two steps. The elections and constituencies a step's address names are therefore read by that step's own page load and not here.
 */

import { redirect } from '@sveltejs/kit';
import { getLocale } from '$lib/paraglide/runtime';
import { buildRoute } from '$lib/routes';

export async function load({ params, parent }) {
  const parentData = await parent();
  if (parentData.gate !== null) return {};

  const facts = parentData.nominationFacts;
  if (!facts) return {};

  if (!facts.editable || facts.admissibleElectionIds.length === 0)
    redirect(
      307,
      buildRoute({
        route: 'ContestantAppNominations',
        locale: getLocale(),
        entityType: params.entityType,
        entityId: params.entityId
      })
    );

  return {};
}
