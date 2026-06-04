import type { LayoutLoad } from './$types';

/**
 * D-01 parity load for the questions route (Phase 100 Plan 100-02).
 *
 * Establishes the unified-layout-with-empty-leaf pattern that already ships in
 * production at `results/[[electionTab]]/+layout.ts`. Question data flows through
 * the client-side `voterCtx` (contexts), NOT through page `load` data, so this
 * load is a parity stub returning `{}` — there is no server guard. Its presence
 * mirrors the results route shape so `questions/+layout.svelte` owns the
 * persistent render shell while `[questionId]/+page.svelte` collapses to an
 * empty leaf.
 */
// eslint-disable-next-line func-style -- reason: SvelteKit LayoutLoad type-binding requires const-form annotation
export const load: LayoutLoad = async () => {
  return {};
};
