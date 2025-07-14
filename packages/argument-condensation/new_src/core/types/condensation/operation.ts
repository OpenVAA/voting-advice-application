/**
 * The operations that can be chained in the condensation process (certain rules apply).
 */
export const CondensationOperations = {
  REFINE: 'REFINE',
  MAP: 'MAP',
  ITERATE_MAP: 'ITERATE_MAP',
  REDUCE: 'REDUCE',
  GROUND: 'GROUND'
} as const;

/**
 * The type of the operations that can be chained in the condensation process.
 */
export type CondensationOperation = (typeof CondensationOperations)[keyof typeof CondensationOperations];
