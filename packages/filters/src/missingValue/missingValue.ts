export const MISSING_VALUE = {
  toString: () => '—'
} as const;

export type MaybeMissing<TType> = TType | typeof MISSING_VALUE;

/**
 * Check whether @param value is a missing value. Prefer this to explicit tests against the const because the logic may change in the future.
 */
export function isMissing(value: unknown): value is typeof MISSING_VALUE {
  return value === MISSING_VALUE;
}
