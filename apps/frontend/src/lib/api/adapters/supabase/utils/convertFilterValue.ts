import type { FilterValue } from '$lib/api/base/getDataFilters.type';

/**
 * Normalize a `getData` filter value into the array of values an RPC fan-out iterates over.
 *
 * The RPCs behind the Supabase adapter accept one scalar per filter axis, while `FilterValue` lets a caller pass either a single value or an array. This helper is the one place that conversion happens, so every fan-out spells it identically.
 *
 * The sentinel is the non-obvious half of the contract: `undefined` and `null` both become `[null]`, a single-element array, so the fan-out issues exactly ONE unfiltered call whose `null` argument applies the SQL `DEFAULT NULL`.
 *
 * An empty array is NOT the same thing, and it is not a successful read either. It THROWS. "Filter by nothing" and "do not filter" are different requests, and only the second one is answerable: returning `[]` fans the caller out over zero ids, which produces an empty result set indistinguishable from a genuine no-match.
 *
 * That case is reachable from a user-supplied URL rather than hypothetical. `parseParams` filters empty values out of an array param, so `?electionId=` yields `[]`; before this guard the voter got a blank app with no error, no redirect and — the production logger being silent — no log line. The caller-side half of the fix is in `(voters)/(located)/+layout.ts`, which now treats an empty id array as no selection and redirects to the selector; this throw is the backstop for every other caller, and it is deliberately loud because there is nothing here to salvage.
 *
 * The generic spans `string | number` rather than only `string`, because election and constituency ids are uuids while an election round is an `integer`.
 *
 * @throws If `value` is an empty array.
 */
export function convertFilterValue<TType extends string | number>(
  value: FilterValue<TType> | null | undefined
): Array<TType | null> {
  if (value == null) return [null];
  if (Array.isArray(value)) {
    if (value.length === 0)
      throw new Error(
        'convertFilterValue: an empty filter array requests nothing and cannot be answered; pass `undefined` to omit the filter instead.'
      );
    return value;
  }
  return [value];
}
