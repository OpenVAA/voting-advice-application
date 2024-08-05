import type { FilterById } from '../dataProvider';

/**
 * Filter data by optional id included in the get data options.
 * @param data Any data array with ids
 * @param options Any get data options
 * @returns Filtered data array
 */
export function filterById<TType extends { id: string }>(
  data: Array<TType>,
  options?: FilterById
): Array<TType> {
  if (options?.id == null) return data;
  return data.filter((d) => d.id == options.id);
}
