/**
 * The `/results` list URL and the entity-plural narrowing that feeds it.
 *
 * All three results route levels emit this URL — the election change, the entity-tab change and the drawer close — so the no-force-fill rule below lives in one place.
 */

import { buildRoute } from './buildRoute';
import type { EntityType } from '@openvaa/data';
import type { BuildRouteCurrent } from './buildRoute';

/** The three plural route segments the `etPl` matcher admits on the `entityTab` param. */
export type EntityPlural = 'candidates' | 'organizations' | 'alliances';

/**
 * Narrow a raw `entityTab` route param to {@link EntityPlural}, or `undefined` when it is absent or is not one of the three.
 *
 * The `etPl` matcher already guards the route, but this narrowing does not trust a URL string on the strength of that. An absent and an invalid param both mean "no explicit plural in the URL".
 *
 * @param raw - `page.params.entityTab`, or any candidate string.
 * @returns The narrowed plural, or `undefined`.
 */
export function narrowEntityPlural(raw: string | undefined): EntityPlural | undefined {
  return raw === 'candidates' || raw === 'organizations' || raw === 'alliances' ? raw : undefined;
}

/**
 * Map an entity type to its plural route segment.
 *
 * Returns `undefined` for an absent or unrecognised type, which callers pass straight through to {@link buildListRoute}, which then omits the segment.
 *
 * @param type - The active entity type, typically `voterContext.currentResultsEntityType`.
 * @returns The plural segment, or `undefined`.
 */
export function pluralForEntityType(type: EntityType | undefined): EntityPlural | undefined {
  if (type === 'candidate') return 'candidates';
  if (type === 'organization') return 'organizations';
  if (type === 'alliance') return 'alliances';
  return undefined;
}

/**
 * Build the localized `/results` list URL for an election and an entity-type tab, with no entity drawer open.
 *
 * Built by {@link buildRoute}, so the URL carries the locale prefix and the persistent search params (`electionId`, `constituencyId`) of `current`, like every other route the app builds.
 *
 * The plural is NEVER defaulted: `/results/{electionTab}` is itself a valid list URL whose tab `voterContext.currentResultsEntityType` implies, and filling in `/candidates` there makes the results guards and this builder bounce navigation between the two shapes. Callers that want a specific tab pass it explicitly.
 *
 * @param electionTab - The selected election id, or `undefined` for the election-picker shape.
 * @param plural - The explicit entity-tab plural, or `undefined` to leave the tab implied.
 * @param current - The current page, whose persistent search params the URL keeps; pass `page` from `$app/state`.
 * @returns The localized list URL.
 */
export function buildListRoute(
  electionTab: string | undefined,
  plural: EntityPlural | undefined,
  current: BuildRouteCurrent
): string {
  return buildRoute(
    { route: 'ResultEntity', electionTab, entityTab: plural, entity: undefined, id: undefined },
    current
  );
}
