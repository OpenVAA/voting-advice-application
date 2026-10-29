import type { FilterValue } from '../base/getDataFilters.type';

/**
 * Perform simple filtering on arrays of `DataObjectData`.
 * @param data - The array of data objects to filter
 * @param filters - The filters to apply
 * @param keyMap - An optional mapping of filter keys to data object keys when these are not the same.
 *
 * @example
 * ```ts
 * // Find elections with id 'election-1'
 * const e1 = filterData({ data: elections, filters: { id: 'election-1' }})[0];
 * // Find question categories for election 'election-1', including those that specify no electionId
 * const categoriesForE1 = filterData({ data: questionCategories, filters: { electionId: { value: 'election-1', includeMissing: true }}});
 * // Find the candidate with id 'cand-1'
 * const filterData({ data: entities, filters: { id: 'cand-1', entityType: 'candidate' }, keyMap: { entityType: 'type' } })
 * ```
 */
export function filterData<TData extends object>({
  data,
  filters
}: {
  data: Array<TData>;
  filters?: Record<string, FilterDataFilter>;
}): Array<TData> {
  if (!filters || !Object.keys(filters).length) return data;
  const processedFilters = new Array<{
    key: string;
    values: Array<string>;
    includeMissing: boolean;
  }>();
  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue;
    let values: Array<string>;
    let includeMissing = false;
    if (typeof value === 'object' && 'value' in value) {
      values = [value.value].flat();
      includeMissing = value.includeMissing ?? false;
    } else {
      values = [value].flat();
    }
    processedFilters.push({
      key,
      values,
      includeMissing
    });
  }
  return data.filter((item) => {
    for (const { key, values, includeMissing } of processedFilters) {
      const target = item[key as keyof typeof item];
      if (target == null) return includeMissing;
      if (Array.isArray(target)) {
        if (!target.some((t) => values.includes(t))) return false;
      } else {
        if (!values.includes(target as ArrayItem<typeof values>)) return false;
      }
    }
    return true;
  });
}

type FilterDataFilter<TFilter extends FilterValue = FilterValue> =
  | undefined
  | TFilter
  | {
      value: TFilter;
      /**
       * If `true`, also those targets will be included which don't have the filtered property set. This is used, e.g., when filtering `Question`s by `electionId`.
       */
      includeMissing?: boolean;
    };
