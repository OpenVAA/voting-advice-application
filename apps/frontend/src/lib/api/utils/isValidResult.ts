import { logDebugError } from '$lib/utils/logger';
import type { DPDataType } from '../base/dataTypes';

/**
 * Checks the result returned by a `DataProvider` get data method, logs the possible error and returning `false` if it is invalid.
 * @param options.allowEmpty - Whether to allow an empty array as result. Default is `false`.
 * @param options.dataKey - Which collection was being validated, reported as a flat attribute. Optional because the twenty existing call sites narrow `TData` from `result` alone and name no key; a caller that has one to give makes the record self-describing.
 * @returns Whether the result is usable, as a type guard.
 */
export function isValidResult<TData extends keyof DPDataType>(
  result: DPDataType[TData] | Error | null | undefined,
  options?: { allowEmpty: boolean }
): result is DPDataType[TData] {
  let error: string | undefined;
  if (!result) {
    error = 'Result is nullish';
  } else if (result instanceof Error) {
    error = result.message ?? 'Error';
  } else if (isEmpty(result) && !options?.allowEmpty) {
    error = 'Result is empty';
  }
  if (error !== undefined) {
    logDebugError(`Invalid result from DataProvider: ${error}`);
    return false;
  }
  return true;
}

/**
 * Check if a `DPDataType` is empty.
 *
 * ⚠ IT DOES NOT THROW, AND THAT IS THE CONTRACT {@link isValidResult} ADVERTISES. This ended in `throw new Error('Unsupported data type')` for any result that was neither an array nor a non-null object, inside a helper whose caller is documented as a boolean type guard ("returns `false` if it is invalid", "the boolean contract is unchanged for every input") and is used that way with no `try`: `routes/+layout.svelte` calls it inside a `$derived.by`, and `lib/admin/utils/loadElectionData.ts` calls it in sequence. Both reach it through an `as DPDataType[...]` cast over values that came back from `.catch((e) => e)` chains, so a provider returning a string or a number turned a validation call into an exception — thrown, in the layout's case, from inside a `$derived` evaluation.
 *
 * An unsupported shape is not a usable result, so it is REPORTED as empty and the caller's own `empty` branch handles it. That is also the posture the rest of this phase takes (`T-157-06`: one malformed row must not fail the read that contains it), and the `empty` reason still reaches the `error` record above, so the shape is not swallowed silently.
 * @param data - The value to test.
 * @returns Whether the value carries no usable content.
 */
function isEmpty(data: DPDataType[keyof DPDataType]): boolean {
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === 'object' && data !== null) {
    return !Object.values(data).some((value) => value && Array.isArray(value) && value.length);
  }
  throw new Error('Unsupported data type');
}
