import type {DataObjectData} from '$lib/_vaa-data';
import {logDebugError} from '$lib/utils/logger';

/**
 * Checks the result returned by a `DataProvider` get data method, logs the possible error and returning `false` if it is invalid.
 */
export function isValidResult(
  result: Array<DataObjectData> | Error
): result is Array<DataObjectData> {
  let error: string | undefined;
  if (!result) error = 'Result is nullish';
  if (result instanceof Error) error = result.message ?? 'Error';
  if (!Array.isArray(result) || result.length === 0) error = 'Result is empty';
  if (error !== undefined) {
    logDebugError(`Invalid result from DataProvider: ${error}`);
    return false;
  }
  return true;
}
