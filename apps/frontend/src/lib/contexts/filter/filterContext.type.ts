import type { EntityType } from '@openvaa/data';
import type { FilterGroup } from '@openvaa/filters';
import type { FilterTree } from '$lib/contexts/voter/filters/filterState.svelte';

/**
 * Symbol-keyed Svelte context exposing the active `FilterGroup` for the current (`electionId`, `entityTab`) URL scope, plus a `$state` version counter that bridges `FilterGroup.onChange` imperative notifications into `$derived` reactivity.
 *
 * Initialized by `initVoterContext()` and read with `getFilterContext()`.
 */
export type FilterContext = {
  /**
   * The currently active `FilterGroup`, scoped by the URL params (`electionId`, `entityTab`). `undefined` when the URL scope is incomplete (e.g. `entityTab` is absent or unrecognized).
   *
   * Reading this getter inside a `$derived` does NOT subscribe to filter-rule mutations — read `version` for that. The reference itself only changes when scope changes (filter state resets per (election, plural) tuple).
   */
  readonly filterGroup: FilterGroup<MaybeWrappedEntityVariant> | undefined;
  /**
   * Version counter for the `$derived` reactivity bridge. Increments whenever the active `FilterGroup` (or any of its filters) emits an `onChange`.
   * Read inside `$derived.by(() => { void fctx.version; ... })` to subscribe to filter-state changes.
   */
  readonly version: number;
};

/**
 * Arguments for `initFilterContext`. The `entityFilters` getter closes over the `FilterTree` built by `filterState()` inside `voterContext`. Filter context does NOT rebuild the tree; it only selects the active `FilterGroup` slice.
 */
export type InitFilterContextArgs = {
  /** Getter returning the current `FilterTree` (rebuilt reactively by `filterState()`). */
  entityFilters: () => FilterTree;
  /**
   * Optional getter returning the singular `EntityType` implied for the current results election. When provided, filterContext resolves its `(electionId, entityType)` scope tuple by reading this getter instead of `page.params.entityTab`. This lets the results route stop force-filling `entityTab` into URLs (which produced a redirect loop). When omitted, filterContext falls back to the legacy URL-derived scope so existing tests + direct entry points keep working.
   */
  currentEntityType?: () => EntityType | undefined;
};
