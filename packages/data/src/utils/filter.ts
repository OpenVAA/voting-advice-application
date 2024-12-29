import type { FilterValue } from '../internal';

/**
 * Perform a simple match between filter values and target.
 * @param filter - The values to include
 * @param target - The target values to match against
 * @returns True if the filter is empty or includes any of the target.
 */
export function match<TValue>({
  filter,
  target
}: {
  filter?: FilterValue<TValue>;
  target?: FilterValue<TValue>;
}): boolean {
  if (filter == null || (Array.isArray(filter) && filter.length === 0)) return true;
  if (target == null || (Array.isArray(target) && target.length === 0)) return false;
  if (!Array.isArray(filter)) filter = [filter];
  if (!Array.isArray(target)) target = [target];
  return target.some((t) => filter.includes(t));
}
