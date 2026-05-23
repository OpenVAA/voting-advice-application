import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

/**
 * Results detail route — coupling + matcher-fallthrough guard (Phase 62 D-11;
 * keys renamed for Phase 88 Plan 88-02 4-segment shape).
 *
 * Valid URL shapes (D-08, post-88-02):
 *   1. /results                                                — list only, default plural tab (+layout.ts redirects)
 *   2. /results/[electionTab]                                  — list only on the selected election, default tab
 *   3. /results/[electionTab]/[entityTab]                      — list only, explicit tab
 *   4. /results/[electionTab]/[entityTab]/[entity]/[id]        — list + drawer (matching entity types)
 *   5. /results/[electionTab]/organizations/candidate/[id]     — edge case: org list + candidate drawer
 *
 * Name-disjoint dissociation:
 *   - ROUTE side: `params.electionTab` = SELECTED singular (Plan 88-02 new).
 *   - SEARCH side: `?electionId=…` / `electionId[N]=…` = AVAILABLE array
 *     (existing PERSISTENT_SEARCH_PARAMS; preserved on redirect via
 *     `url.search`).
 *
 * Coupling rule (D-11): `entity` and `id` must both be present OR
 * both absent. Exactly-one-present URLs (e.g.
 * `/results/test-el-reg/candidates/candidate` with no id) are invalid drawer
 * states and redirect 307 back to the parent list route.
 *
 * Matcher-fallthrough guard (D-11): with all-optional matcher-gated segments,
 * SvelteKit treats a segment that fails its matcher as missing and lets the
 * next optional segment pick up the value. So
 * `/results/[electionTab]/invalidplural` resolves to `id=invalidplural` with
 * no plural/singular. We treat this case (id set, both plural AND singular
 * missing) as a 404 — it's a bad URL where the user typed something that
 * matched none of the matchers.
 */
// eslint-disable-next-line func-style -- reason: SvelteKit PageLoad type-binding requires const-form annotation
export const load: PageLoad = async ({ params, url }) => {
  const { entity, id, entityTab, electionTab } = params;

  // Matcher-fallthrough: id is the only thing set under the etPl/etSg pair →
  // URL like /results/[electionTab]/invalidplural
  if (id && !entity && !entityTab) {
    throw error(404, 'Not Found');
  }

  if ((entity && !id) || (!entity && id)) {
    const electionSegment = electionTab ? `/${electionTab}` : '';
    const listSuffix = entityTab ? `/${entityTab}` : '/candidates';
    throw redirect(307, `/results${electionSegment}${listSuffix}${url.search}`);
  }

  return {};
};
