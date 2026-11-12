/**
 * Decide what a signed-in user who asks for the root of the Contestant App gets (server-side). The root names no entity, so the decision is made on the user-level load's list alone:
 *
 * 1. **The parent.** The user-level load's `gate` and `entities`, awaited before anything else. While a gate is pending the load returns an empty object and redirects nowhere, so the gate's view is shown at the root.
 * 2. **No entity.** The load returns `{ view: 'nothingToEdit' }`: the user stays signed in and is told there is nothing to edit.
 * 3. **Exactly one entity.** The user is redirected to that entity's home.
 * 4. **Several entities.** The load returns `{ view: 'select' }`: the user chooses which one to edit.
 *
 * The load takes `parent` from the request event and nothing else: it reads no `url` property, no `route` and no param. It signs nobody out.
 */

import { redirect } from '@sveltejs/kit';
import { getLocale } from '$lib/paraglide/runtime';
import { buildRoute } from '$lib/routes';

export async function load({ parent }): Promise<{ view?: 'nothingToEdit' | 'select' }> {
  const parentData = await parent();
  if (parentData.gate !== null) return {};
  const { entities } = parentData;

  if (entities.length === 1) {
    const [{ type, id }] = entities;
    redirect(
      307,
      buildRoute({
        route: 'ContestantAppEntityHome',
        locale: getLocale(),
        entityType: type,
        entityId: id
      })
    );
  }

  return { view: entities.length === 0 ? 'nothingToEdit' : 'select' };
}
