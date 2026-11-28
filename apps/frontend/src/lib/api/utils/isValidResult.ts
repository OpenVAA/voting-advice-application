import { log } from '@openvaa/app-shared';
import type { DPDataType } from '../base/dataTypes';

/**
 * The event name every invalid-result report is filed under.
 *
 * A CONSTANT, never an interpolation, the same rule `parseOutcome.ts`'s `PARSE_FAILURE_MESSAGE` follows: a downstream sink keys events on a stable message, and every varying value belongs in the flat attribute bag beside it instead.
 */
const INVALID_RESULT_MESSAGE = 'A DataProvider returned an invalid result.';

/**
 * Which of the three branches rejected the result.
 *
 * `nullish` and `empty` are the two the caller can act on differently; `error` says the provider itself reported a failure. The provider's own error TEXT is deliberately not part of this — see {@link isValidResult}.
 */
type InvalidResultReason = 'nullish' | 'error' | 'empty';

/**
 * Checks the result returned by a `DataProvider` get data method, reports the reason it was rejected and returns `false` if it is invalid.
 *
 * **The reported record discloses the branch, never the provider's message.** Production logs at `'warn'`, which makes every `error` record in this tree collectable from container stdout, and on this stack a PostgREST/Supabase error message can echo the query text that produced it. The helper also sits directly on the settings path in `routes/+layout.svelte`, which is the path a malformed `app_settings.settings` column travels. So the message is a constant, the branch travels as a flat attribute, and the provider's error is neither interpolated nor passed as `err` — `serialiseError` would carry both its `message` and its `stack` into the same sink.
 *
 * @param result - The value the `DataProvider` returned, which may be an `Error` it caught.
 * @param options.allowEmpty - Whether to allow an empty array as result. Default is `false`.
 * @param options.dataKey - Which collection was being validated, reported as a flat attribute. Optional because the twenty existing call sites narrow `TData` from `result` alone and name no key; a caller that has one to give makes the record self-describing.
 * @returns Whether the result is usable, as a type guard.
 */
export function isValidResult<TData extends keyof DPDataType>(
  result: DPDataType[TData] | Error | null | undefined,
  options?: { allowEmpty?: boolean; dataKey?: TData }
): result is DPDataType[TData] {
  let reason: InvalidResultReason | undefined;
  if (!result) {
    reason = 'nullish';
  } else if (result instanceof Error) {
    reason = 'error';
  } else if (isEmpty(result) && !options?.allowEmpty) {
    reason = 'empty';
  }
  if (reason !== undefined) {
    log.error(INVALID_RESULT_MESSAGE, { reason, dataKey: options?.dataKey });
    return false;
  }
  return true;
}

/**
 * Check if a `DPDataType` is empty.
 *
 * ⚠ IT DOES NOT THROW, AND THAT IS THE CONTRACT {@link isValidResult} ADVERTISES. Its caller is a boolean type guard ("returns `false` if it is invalid") used with no `try`: `routes/+layout.svelte` calls it inside a `$derived.by`, and `lib/admin/utils/loadElectionData.ts` calls it in sequence. Both reach it through an `as DPDataType[...]` cast over values that came back from `.catch((e) => e)` chains, so a provider returning a string or a number must not turn a validation call into an exception — thrown, in the layout's case, from inside a `$derived` evaluation.
 *
 * An unsupported shape is not a usable result, so it is REPORTED as empty and the caller's own `empty` branch handles it. That is also the posture the parse helpers take (one malformed row must not fail the read that contains it), and the `empty` reason still reaches the `error` record above, so the shape is not swallowed silently.
 * @param data - The value to test.
 * @returns Whether the value carries no usable content.
 */
function isEmpty(data: DPDataType[keyof DPDataType]): boolean {
  if (Array.isArray(data)) return data.length === 0;
  if (typeof data === 'object' && data !== null) {
    return !Object.values(data).some((value) => value && Array.isArray(value) && value.length);
  }
  return true;
}
