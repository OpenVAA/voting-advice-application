/**
 * Supported condensation methods for argument condensation.
 */
export const CONDENSATION_METHOD = {
  MAP_REDUCE: 'map-reduce',
  REFINE: 'refine',
  HYBRID: 'hybrid',
  SEQUENTIAL: 'sequential',
  PARALLEL: 'parallel'
} as const;

export type CondensationMethod = typeof CONDENSATION_METHOD[keyof typeof CONDENSATION_METHOD];