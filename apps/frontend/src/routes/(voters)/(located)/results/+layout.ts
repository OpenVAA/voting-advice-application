import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

/**
 * Canonicalize `/results` (no entity-type-plural) to `/results/candidates` so
 * deep-linkable URLs consistently carry the tab segment (RESEARCH
 * §Alternatives Considered A3 — planner chose redirect over render-with-default
 * for URL shareability per Phase 62 D-09, D-13).
 *
 * electionId + constituencyId remain as persistent search params
 * (PERSISTENT_SEARCH_PARAMS in `$lib/utils/route/params.ts`); the redirect
 * preserves them via `url.search`. The parent `(located)/+layout.ts` has
 * already enforced electionId + constituencyId presence; if either is
 * missing it has redirected to the selection page before this load runs.
 *
 * Skip conditions:
 * 1. `entityTypePlural` already present → URL is already canonical.
 * 2. `entityTypeSingular` or `id` present → a detail URL; leave it alone so
 *    the child `+page.ts` coupling-guard handles it.
 * 3. No search params → unlikely (the (located) layout guarantees both) but
 *    falls through harmlessly, redirecting to `/results/candidates`.
 */
export const load: LayoutLoad = async ({ params, url }) => {
  if (params.entityTypePlural) return {};
  if (params.entityTypeSingular || params.id) return {};
  throw redirect(307, `/results/candidates${url.search}`);
};
