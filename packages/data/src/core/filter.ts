/**
 * Represents a filter result where no values are applicable (intersection is empty).
 * This is used to distinguish between "no restrictions" (empty array) and "no valid intersection".
 */
export const FILTER_NONE_APPLICABLE = { filterNoneApplicable: true } as const;

/**
 * Type guard to check if a value is FILTER_NONE_APPLICABLE.
 */
export function isFilterNoneApplicable(value: unknown): value is typeof FILTER_NONE_APPLICABLE {
  return (
    value != null && typeof value === 'object' && 'filterNoneApplicable' in value && value.filterNoneApplicable === true
  );
}
