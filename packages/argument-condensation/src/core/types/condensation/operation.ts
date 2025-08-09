/**
 * The operations that can be chained in the condensation process.
 * See src/core/utils/condensation/planValidation.ts for details of the chaining rules.
 */
export const CONDENSATION_OPERATIONS = {
  REFINE: 'REFINE',
  MAP: 'MAP',
  ITERATE_MAP: 'ITERATE_MAP',
  REDUCE: 'REDUCE',
  GROUND: 'GROUND'
} as const;

/**
 * The type for operations that can be chained in the condensation process.
 */
export type CondensationOperation = (typeof CONDENSATION_OPERATIONS)[keyof typeof CONDENSATION_OPERATIONS];
