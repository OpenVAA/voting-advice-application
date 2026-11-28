/**
 * The error an `account-access` operation throws when the function refused the caller for making more requests than its per-caller limit admits. The refusal comes before any work of the operation, so it says nothing about the code or the address the request carried.
 */
export class TooManyRequestsError extends Error {
  override name = 'TooManyRequestsError';

  /**
   * @param retryAfterSeconds - The whole seconds, at least 1, until the caller may ask again.
   */
  constructor(readonly retryAfterSeconds: number) {
    super(`Too many requests; retry after ${retryAfterSeconds} s`);
  }
}

/** The wait assumed when a refusal carries no readable `Retry-After`. */
const DEFAULT_RETRY_AFTER_SECONDS = 60;

/**
 * The seconds a `Retry-After` header names, at least 1, or a minute when the header is absent or is not a whole number of seconds.
 * @param header - The header's value, or `null` when the answer carries none.
 */
export function parseRetryAfter(header: string | null): number {
  const seconds = header !== null && /^\d+$/.test(header.trim()) ? Number(header.trim()) : NaN;
  return Number.isSafeInteger(seconds) ? Math.max(1, seconds) : DEFAULT_RETRY_AFTER_SECONDS;
}
