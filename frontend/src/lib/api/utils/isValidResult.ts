import { logDebugError } from '$lib/utils/logger';
import type { DPDataType } from '../base/dataTypes';

/**
 * Checks the result returned by a `DataProvider` get data method, logs the possible error and returning `false` if it is invalid.
 * @param options.allowEmpty Whether to allow an empty array as result. Default is `false`.
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
 */
function isEmpty(data: DPDataType[keyof DPDataType]): boolean {
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === 'object' && data !== null) {
    return !Object.values(data).some((value) => value && Array.isArray(value) && value.length);
  }
  throw new Error('Unsupported data type');
}
