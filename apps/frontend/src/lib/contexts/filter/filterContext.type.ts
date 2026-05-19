import type { FilterGroup } from '@openvaa/filters';
import type { FilterTree } from '$lib/contexts/voter/filters/filterStore.svelte';

/**
 * Symbol-keyed Svelte context exposing the active `FilterGroup` for the current
 * (`electionId`, `entityTypePlural`) URL scope, plus a `$state` version counter
 * that bridges `FilterGroup.onChange` imperative notifications into `$derived`
 * reactivity. See `filterContext.svelte.ts` for the implementation analog
 * (`dataContext.svelte.ts` lines 33-50).
 *
 * Per Phase 62 D-05, this context is initialized by `initVoterContext()` and
 * accessible either directly via `getFilterContext()` (for the future LLM chat
 * surface) or via `getVoterContext().filterContext` (for the voter-flow UI).
 */
export type FilterContext = {
  /**
   * The currently active `FilterGroup`, scoped by the URL params
   * (`electionId`, `entityTypePlural`). `undefined` when the URL scope is
   * incomplete (e.g. `entityTypePlural` is absent or unrecognized).
   *
   * Reading this getter inside a `$derived` does NOT subscribe to filter-rule
   * mutations — read `version` for that. The reference itself only changes
   * when scope changes (D-14: filter state resets per (election, plural) tuple).
   */
  readonly filterGroup: FilterGroup<MaybeWrappedEntityVariant> | undefined;
  /**
   * Version counter for the `$derived` reactivity bridge. Increments whenever
   * the active `FilterGroup` (or any of its filters) emits an `onChange`.
   * Read inside `$derived.by(() => { void fctx.version; ... })` to subscribe
   * to filter-state changes. See RESEARCH.md §Pitfall 1.
   */
  readonly version: number;
  /**
   * Set a filter rule by filter name/id. Routes through `filter.setRule()` to
   * preserve the `onChange` emission that drives the version counter.
   * Per D-06 this is the typed mutator surface intended for the future LLM chat
   * integration; UI components today still call `filter.setRule()` directly via
   * the `EntityFilters` component.
   */
  setFilter(id: string, value: unknown): void;
  /**
   * Reset all filters in the active `FilterGroup`. Calls `FilterGroup.reset()`,
   * which itself emits `onChange` and bumps the version counter.
   */
  resetFilters(): void;
  /**
   * Add a filter to the active group. Not implemented in Phase 62 — the spec is
   * deferred to the future LLM chat integration per D-06. Logs a warning when
   * called so any pre-completion consumer hits a visible signal.
   */
  addFilter(spec: unknown): void;
  /**
   * Remove a filter by id. Not implemented in Phase 62 (see `addFilter`).
   */
  removeFilter(id: string): void;
};

/**
 * Arguments for `initFilterContext`. The `entityFilters` getter closes over the
 * `FilterTree` built by `filterStore()` inside `voterContext`. Filter context
 * does NOT rebuild the tree; it only selects the active `FilterGroup` slice.
 */
export type InitFilterContextArgs = {
  /** Getter returning the current `FilterTree` (rebuilt reactively by `filterStore()`). */
  entityFilters: () => FilterTree;
};
