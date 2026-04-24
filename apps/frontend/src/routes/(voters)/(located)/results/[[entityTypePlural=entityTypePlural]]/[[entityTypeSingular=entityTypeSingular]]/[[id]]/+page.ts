import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

/**
 * Results detail route — coupling guard (Phase 62 D-11).
 *
 * Valid URL shapes (D-08):
 *   1. /results                                              — list only, default plural tab (+layout.ts redirects)
 *   2. /results/[plural]                                     — list only, explicit plural tab
 *   3. /results/[plural]/[singular]/[id]                     — list + drawer (matching entity types)
 *   4. /results/organizations/candidate/[id]                 — edge case: org list + candidate drawer
 *
 * electionId + constituencyId travel as PERSISTENT_SEARCH_PARAMS (see
 * `$lib/utils/route/params.ts`) — preserved via `url.search` on redirect.
 *
 * Coupling rule (D-11): `entityTypeSingular` and `id` must both be present OR
 * both absent. Exactly-one-present URLs (e.g. `/results/candidates/candidate`
 * with no id, or `/results/candidates//X` with no singular) are invalid
 * drawer states and redirect 307 back to the parent list route.
 *
 * The coupling guard runs on both server and client navigation — single
 * source of truth per threat T-62-05. Matcher-gated path segments
 * (entityTypePlural / entityTypeSingular) are validated earlier by the
 * SvelteKit matchers before this load function runs.
 *
 * Drawer entity lookup now happens in the parent `+layout.svelte` (Plan
 * 62-03 — drawer-over-list rendering with `content-visibility: auto`
 * paint deferral per D-10). This load function's single responsibility is
 * the coupling guard.
 */
export const load: PageLoad = async ({ params, url }) => {
  const { entityTypeSingular, id, entityTypePlural } = params;

  if ((entityTypeSingular && !id) || (!entityTypeSingular && id)) {
    const listSuffix = entityTypePlural ? `/${entityTypePlural}` : '/candidates';
    throw redirect(307, `/results${listSuffix}${url.search}`);
  }

  return {};
};
