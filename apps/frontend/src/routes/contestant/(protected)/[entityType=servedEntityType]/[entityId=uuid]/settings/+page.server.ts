/**
 * Lead the settings address under an entity to the settings page at the app's root (server-side).
 *
 * The settings page belongs to the user rather than to an entity, so it has one address, `ContestantAppSettings`. This address still answers, because a link kept from before or typed by hand may name an entity: the load redirects it with 307 to that page, in the request's locale.
 *
 * The load reads nothing of the request: no param, no parent data and no `url` property. Its answer is therefore the same for every id the entity matcher admits, and it adds nothing to what an entity address already tells about whether the entity exists or is the user's. The layout loads above it run for the request as for every page below them: the protected layout's gates, and the entity layout, which leads an entity the user does not edit to the app's root.
 */

import { redirect } from '@sveltejs/kit';
import { getLocale } from '$lib/paraglide/runtime';
import { buildRoute } from '$lib/routes';

export function load(): never {
  redirect(307, buildRoute({ route: 'ContestantAppSettings', locale: getLocale() }));
}
