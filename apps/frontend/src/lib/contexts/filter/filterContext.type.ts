import type { EntityType } from '@openvaa/data';
import type { FilterGroup } from '@openvaa/filters';
import type { FilterTree } from '$lib/contexts/voter/filters/filterState.svelte';

/**
 * Symbol-keyed Svelte context exposing the active `FilterGroup` for the current (`electionId`, `entityTab`) URL scope (`entityTab` renamed from `entityTypePlural`), plus a `$state` version counter that bridges `FilterGroup.onChange` imperative notifications into `$derived` reactivity. See `filterContext.svelte.ts` for the implementation analog (`dataContext.svelte.ts` lines 33-50).
 *
 * This context is initialized by `initVoterContext()` and accessible either directly via `getFilterContext()` (for the future LLM chat surface) or via `getVoterContext().filterContext` (for the voter-flow UI).
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
  /**
   * Set a filter rule by filter name/id. Routes through `filter.setRule()` to preserve the `onChange` emission that drives the version counter.
   * This is the typed mutator surface intended for the future LLM chat integration; UI components today still call `filter.setRule()` directly via the `EntityFilters` component.
   */
  setFilter(id: string, value: unknown): void;
  /**
   * Reset all filters in the active `FilterGroup`. Calls `FilterGroup.reset()`, which itself emits `onChange` and bumps the version counter.
   */
  resetFilters(): void;
  /**
   * Add a filter to the active group. Not implemented — the spec is deferred to the future LLM chat integration. Logs a warning when called so any pre-completion consumer hits a visible signal.
   */
  addFilter(spec: unknown): void;
  /**
   * Remove a filter by id. Not implemented (see `addFilter`).
   */
  removeFilter(id: string): void;
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
