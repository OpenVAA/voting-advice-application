/**
 * The single source of the `/results` list URL, and the entity-plural narrowing that feeds it.
 *
 * Extracted from `[[electionTab]]/+layout.svelte` when phase 165 (D-07, D-08) split that 401-line layout into three route levels. All three levels emit this URL — the election-change handler at the election-tab layout, the entity-tab change handler at the entity-tab layout, and the drawer-close handler at the innermost page — so the alternative to this module is three copies of the builder and three copies of the narrowing. The no-force-fill rule below is exactly the kind of invariant that survives in two copies and is quietly dropped in the third, which is why it lives in one place.
 *
 * `buildListRoute` reads `page.url.search` from `$app/state` directly, so it needs no props and no context. That is what makes it extractable to a plain module rather than a prop-drilled callback, and it is also why callers must invoke it from inside a reactive scope or an event handler rather than caching its result.
 *
 * This module holds no component state and reads no context, so it is not subject to the Context Destructuring Rule. Its callers are.
 */

import { page } from '$app/state';
import type { EntityType } from '@openvaa/data';

/** The three plural route segments the `etPl` matcher admits on the `entityTab` param. American spelling, matching the matcher and the route table. */
export type EntityPlural = 'candidates' | 'organizations' | 'alliances';

/**
 * Narrow a raw `entityTab` route param to {@link EntityPlural}, or `undefined` when it is absent or is not one of the three.
 *
 * The param is already gated by the `etPl` matcher before any component mounts, so in practice a non-matching value never arrives here — but the matcher is a runtime guard on the ROUTE and this is a type-level narrowing in the COMPONENT, and collapsing the two would mean trusting a string from the URL because something else is believed to have checked it. Returning `undefined` rather than throwing keeps the missing-param case (a bare `/results/{electionTab}` URL) on the same path as the invalid one, which is correct: both mean "no explicit plural in the URL".
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
 * Returns `undefined` for an absent or unrecognised type, and callers pass that `undefined` straight through to {@link buildListRoute}, which omits the segment. That is the no-force-fill rule applied at the call site rather than defended only inside the builder.
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
 * Build a path-only /results URL with the SELECTED election landing on the new `electionTab` route segment and the existing search params preserved verbatim.
 *
 * Name-disjoint dissociation: `electionTab` is the route-side singular (route side); `electionId` is the search-side AVAILABLE-array (existing PERSISTENT_SEARCH_PARAMS member at `$lib/routes/params.ts`).
 * The two never alias: the search-side AVAILABLE array is preserved as-is, and the route-side electionTab is the canonical SELECTED-singular surface.
 *
 * @param electionTab - The SELECTED election id, or `undefined` for the picker shape.
 * @param plural - The explicit entity-tab plural, or `undefined` to leave the tab implied. NEVER substitute a default here; see the comment inside.
 * @returns A path-only URL with the current search string appended verbatim.
 */
export function buildListRoute(electionTab: string | undefined, plural: EntityPlural | undefined): string {
  const electionSegment = electionTab ? `/${electionTab}` : '';
  // No `/candidates` force-fill when plural is absent: the URL `/results/{electionTab}` is itself a valid render shape — voterContext.currentResultsEntityType implies the active tab and the layout renders the entity-type selector only when 2+ types exist for the election. Callers that want a specific tab in the URL (handleEntityTabChange, post-drawer-close) still pass an explicit plural.
  const pluralSegment = plural ? `/${plural}` : '';
  // Preserve any persistent search params (electionId AVAILABLE array, constituencyId, etc.) on the URL verbatim. The route side now owns the SELECTED election surface; the search side keeps its existing AVAILABLE-array role.
  return `/results${electionSegment}${pluralSegment}${page.url.search}`;
}
