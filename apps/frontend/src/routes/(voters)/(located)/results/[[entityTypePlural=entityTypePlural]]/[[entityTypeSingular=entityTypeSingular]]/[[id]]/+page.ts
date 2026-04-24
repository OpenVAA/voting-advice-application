import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

/**
 * Results detail route — coupling guard (Phase 62 D-11).
 *
 * Valid URL shapes (D-08):
 *   1. /results/[electionId]                                     — list only, default plural tab
 *   2. /results/[electionId]/[plural]                            — list only, explicit plural tab
 *   3. /results/[electionId]/[plural]/[singular]/[id]            — list + drawer (matching entity types)
 *   4. /results/[electionId]/organizations/candidate/[id]        — edge case: org list + candidate drawer
 *
 * Coupling rule (D-11): `entityTypeSingular` and `id` must both be present OR
 * both absent. Exactly-one-present URLs (e.g. `/results/E/candidates/candidate`
 * with no id, or `/results/E/candidates//X` with no singular) are invalid
 * drawer states and redirect 307 back to the parent list route.
 *
 * The coupling guard runs on both server and client navigation — single
 * source of truth per threat T-62-05. Matcher-gated path segments
 * (entityTypePlural / entityTypeSingular) are validated earlier by the
 * SvelteKit matchers before this load function runs.
 *
 * Drawer entity lookup itself happens in the parent `+layout.svelte` in
 * Plan 62-03 (Open Question 4 RESOLVED — drawer-first paint uses
 * layout-level `content-visibility: auto`, not a streamed promise here).
 * This load function's single responsibility is the coupling guard.
 */
export const load: PageLoad = async ({ params }) => {
  const { entityTypeSingular, id, entityTypePlural, electionId } = params;

  if ((entityTypeSingular && !id) || (!entityTypeSingular && id)) {
    const listSuffix = entityTypePlural ? `/${entityTypePlural}` : '';
    throw redirect(307, `/results/${electionId}${listSuffix}`);
  }

  return {};
};
