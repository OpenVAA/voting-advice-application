import type { FilterGroup } from '@openvaa/filters';

/**
 * Pure helper used inside `EntityListWithControls.svelte`'s `$derived.by`.
 * Applies the active `FilterGroup` (if any) followed by the search filter
 * (if any). Both inputs are optional. Returns a fresh array (never mutates
 * the input).
 *
 * Both `FilterGroup.apply` and the search filter's `apply` are pure
 * `[VERIFIED: packages/filters/src/group/filterGroup.ts:46-52, packages/filters/src/filter/base/filter.ts:92-105]`,
 * which makes this helper safe to call inside a Svelte 5 `$derived` —
 * the compiler will not warn about non-pure reads.
 *
 * Tested in `EntityListWithControls.test.ts`.
 */
export function computeFiltered<TEntity>(
  entities: ReadonlyArray<TEntity>,
  filterGroup: { apply: <T>(targets: Array<T>) => Array<T> } | undefined,
  searchFilter: { apply: <T>(targets: Array<T>) => Array<T> } | undefined
): Array<TEntity> {
  const afterGroup = filterGroup ? filterGroup.apply([...entities]) : [...entities];
  return searchFilter ? searchFilter.apply(afterGroup) : afterGroup;
}

/**
 * Pure helper for the badge counter on the filter trigger button. Returns
 * the number of currently-active filters in the group, or 0 when no group
 * is provided. Mirrors the original idiom at
 * `EntityListControls.svelte:71` (`filterGroup.filters.filter((f) => f.active).length`).
 */
export function countActiveFilters(
  filterGroup: { filters: ReadonlyArray<{ active: boolean }> } | undefined
): number {
  if (!filterGroup) return 0;
  return filterGroup.filters.filter((f) => f.active).length;
}

/**
 * Re-export shape used by `EntityListWithControls.svelte` so the
 * filterGroup parameter accepts both the real `@openvaa/filters` `FilterGroup`
 * and the structurally-compatible test fakes.
 */
export type FilterGroupLike<TEntity> = Pick<FilterGroup<MaybeWrappedEntityVariant>, 'apply' | 'filters'> & {
  filters: ReadonlyArray<{ active: boolean; name: string }>;
};
// Suppress unused TEntity if not needed by consumers — kept for future generic extension.
export type _Unused<TEntity> = TEntity;
