import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

/**
 * Results detail route — coupling + matcher-fallthrough guard (Phase 62 D-11).
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
 * with no id) are invalid drawer states and redirect 307 back to the parent
 * list route.
 *
 * Matcher-fallthrough guard (D-11): with all-optional matcher-gated segments,
 * SvelteKit treats a segment that fails its matcher as missing and lets the
 * next optional segment pick up the value. So `/results/invalidplural`
 * resolves to `id=invalidplural` with no plural/singular. We treat this case
 * (id set, both plural AND singular missing) as a 404 — it's a bad URL where
 * the user typed something that matched none of the matchers.
 */
export const load: PageLoad = async ({ params, url }) => {
  const { entityTypeSingular, id, entityTypePlural } = params;

  // Matcher-fallthrough: id is the only thing set → URL like /results/invalidplural
  if (id && !entityTypeSingular && !entityTypePlural) {
    throw error(404, 'Not Found');
  }

  if ((entityTypeSingular && !id) || (!entityTypeSingular && id)) {
    const listSuffix = entityTypePlural ? `/${entityTypePlural}` : '/candidates';
    throw redirect(307, `/results${listSuffix}${url.search}`);
  }

  return {};
};
