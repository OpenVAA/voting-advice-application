import { FILTER_NONE_APPLICABLE } from '../core/filter';
import type { FilterValue } from '../internal';

/**
 * Intersects two filter values, combining restrictions from parent and child.
 *
 * Logic:
 * - If both filters are empty/null (no restrictions), returns empty array
 * - If only one has restrictions, returns those restrictions
 * - If both have restrictions, returns the intersection
 * - If intersection is empty (conflicting restrictions), returns FILTER_NONE_APPLICABLE
 *
 * @param childFilter - The child's filter value
 * @param parentFilter - The parent's filter value
 * @param compareFn - Optional comparison function for complex types (default: ===)
 * @returns The intersected filter value or FILTER_NONE_APPLICABLE
 */
export function intersectFilters<TValue>(
  childFilter: FilterValue<TValue> | null | undefined,
  parentFilter: FilterValue<TValue> | null | undefined,
  compareFn = (a: TValue, b: TValue) => a === b
): Array<TValue> | typeof FILTER_NONE_APPLICABLE {
  const childArray = childFilter == null ? [] : Array.isArray(childFilter) ? childFilter : [childFilter];
  const parentArray = parentFilter == null ? [] : Array.isArray(parentFilter) ? parentFilter : [parentFilter];

  if (childArray.length === 0) return parentArray;
  if (parentArray.length === 0) return childArray;

  const intersection = childArray.filter((childVal) => parentArray.some((parentVal) => compareFn(childVal, parentVal)));

  return intersection.length === 0 ? FILTER_NONE_APPLICABLE : intersection;
}
