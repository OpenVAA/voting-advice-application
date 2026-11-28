import type { FilterValue } from '$lib/api/base/getDataFilters.type';

/**
 * Normalize a `getData` filter value into the id array an RPC's array parameter takes.
 *
 * `undefined` and `null` both become `undefined`, so the RPC call omits the parameter and its SQL `DEFAULT NULL` applies no filter on that axis. A single value becomes a one-element array.
 *
 * An empty array THROWS. "Filter by nothing" and "do not filter" are different requests, and only the second one is answerable: an empty id array matches no row, which is indistinguishable from a genuine no-match. The case is reachable from a user-supplied URL, because `parseParams` filters empty values out of an array param, so `?electionId=` yields `[]`. `(voters)/(located)/+layout.ts` treats an empty id array as no selection and redirects to the selector; this throw is the backstop for every other caller.
 *
 * @throws If `value` is an empty array.
 */
export function convertFilterValue<TType extends string | number>(
  value: FilterValue<TType> | null | undefined
): Array<TType> | undefined {
  if (value == null) return undefined;
  if (Array.isArray(value)) {
    if (value.length === 0)
      throw new Error(
        'convertFilterValue: an empty filter array requests nothing and cannot be answered; pass `undefined` to omit the filter instead.'
      );
    return value;
  }
  return [value];
}
