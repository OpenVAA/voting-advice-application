export const MISSING_FILTER_VALUE = {
  toString: () => '—'
} as const;

export type MaybeMissing<TType> = TType | typeof MISSING_FILTER_VALUE;

/**
 * Check whether @param value - is a missing filter value. Prefer this to explicit tests against the const because the logic may change in the future.
 */
export function isMissing(value: unknown): value is typeof MISSING_FILTER_VALUE {
  return value === MISSING_FILTER_VALUE;
}
