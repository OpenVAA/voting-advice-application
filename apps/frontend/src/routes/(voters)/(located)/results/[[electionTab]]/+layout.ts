import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

/**
 * Canonicalize `/results` (no entity-tab segment) to `/results/candidates` so
 * deep-linkable URLs consistently carry the tab segment (RESEARCH
 * §Alternatives Considered A3 — planner chose redirect over render-with-default
 * for URL shareability per Phase 62 D-09, D-13).
 *
 * Phase 88 Plan 88-02 introduced the optional FRONT route segment
 * `[[electionTab]]` (the SELECTED election). The full server-side guards
 * (invalid-electionTab strip-and-redirect; 1-available auto-redirect to
 * `/results/{id}/candidates`; 2+ available picker render) live in this
 * `+layout.ts` after Task 6 lands. Until then, the bare canonicalization to
 * `/results/candidates` below is preserved verbatim — Task 6 supersedes it
 * with the full guard set.
 *
 * Name-disjoint dissociation:
 *   - ROUTE side: `params.electionTab` (Plan 88-02 new) = SELECTED singular.
 *   - SEARCH side: `?electionId=…` / `electionId[N]=…` (existing) = AVAILABLE
 *     array, surfaced via `voterContext.selectedElections`.
 * The two share NO key name. `url.search` is preserved verbatim on the
 * redirect below so the AVAILABLE-array surface carries forward.
 *
 * The parent `(located)/+layout.ts` has already enforced electionId +
 * constituencyId presence on the search-side; if either is missing it has
 * redirected to the selection page before this load runs.
 *
 * Skip conditions:
 * 1. `entityTab` already present → URL is already canonical.
 * 2. `entity` or `id` present → a detail URL; leave it alone so
 *    the child `+page.ts` coupling-guard handles it.
 * 3. No search params → unlikely (the (located) layout guarantees both) but
 *    falls through harmlessly, redirecting to `/results/candidates`.
 */
// eslint-disable-next-line func-style -- reason: SvelteKit LayoutLoad type-binding requires const-form annotation
export const load: LayoutLoad = async ({ params, url }) => {
  if (params.entityTab) return {};
  if (params.entity || params.id) return {};
  throw redirect(308, `/results/candidates${url.search}`);
};
