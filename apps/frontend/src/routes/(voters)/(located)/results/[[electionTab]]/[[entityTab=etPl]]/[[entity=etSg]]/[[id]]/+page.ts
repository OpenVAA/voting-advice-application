import { error, redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

/**
 * Results detail route — coupling + matcher-fallthrough guard (see phase 62;
 * keys renamed for the 4-segment shape; see phase 88).
 *
 * Valid URL shapes (post-88-02 + loop-fix):
 *   1. /results                                                — picker view; +layout.ts redirects only when 1 election available
 *   2. /results/[electionTab]                                  — list view; voterContext implies the active tab
 *   3. /results/[electionTab]/[entityTab]                      — list view, explicit tab
 *   4. /results/[electionTab]/[entityTab]/[entity]/[id]        — list + drawer (matching entity types)
 *   5. /results/[electionTab]/organizations/candidate/[id]     — edge case: org list + candidate drawer
 *
 * Name-disjoint dissociation:
 *   - ROUTE side: `params.electionTab` = SELECTED singular.
 *   - SEARCH side: `?electionId=…` / `electionId[N]=…` = AVAILABLE array
 *     (existing PERSISTENT_SEARCH_PARAMS; preserved on redirect via
 *     `url.search`).
 *
 * Coupling rule: `entity` and `id` must both be present OR
 * both absent. Exactly-one-present URLs (e.g.
 * `/results/test-el-reg/candidates/candidate` with no id) are invalid drawer
 * states and redirect 307 back to the parent list route.
 *
 * Matcher-fallthrough guard: with all-optional matcher-gated segments,
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
    // Post-88-02 loop fix: no `/candidates` fallback when entityTab is
    // absent. `/results/{electionTab}` is a valid render shape —
    // voterContext.currentResultsEntityType implies the active tab and the
    // layout selector picks up the user's next interaction.
    const listSuffix = entityTab ? `/${entityTab}` : '';
    throw redirect(307, `/results${electionSegment}${listSuffix}${url.search}`);
  }

  return {};
};
