import type {DataObjectData} from '$lib/_vaa-data';
import {logDebugError} from '$lib/utils/logger';

/**
 * Checks the result returned by a `DataProvider` get data method, logs the possible error and returning `false` if it is invalid.
 * @param options.allowEmpty Whether to allow an empty array as result. Default is `false`.
 */
export function isValidResult(
  result: Array<DataObjectData> | Error,
  options?: {allowEmpty: boolean}
): result is Array<DataObjectData> {
  let error: string | undefined;
  if (!result) error = 'Result is nullish';
  if (result instanceof Error) error = result.message ?? 'Error';
  if (!Array.isArray(result) || (result.length === 0 && !options?.allowEmpty))
    error = 'Result is empty';
  if (error !== undefined) {
    logDebugError(`Invalid result from DataProvider: ${error}`);
    return false;
  }
  return true;
}
