import type { FilterById } from '../../dataProvider';

/**
 * Filter data by optional id included in the get data options.
 * @param data Any data array with ids
 * @param options Any get data options
 * @returns Filtered data array
 */
export function filterById<TData extends { id: string }>(data: Array<TData>, options?: FilterById): Array<TData> {
  if (options?.id == null) return data;
  return data.filter((d) => d.id == options.id);
}
