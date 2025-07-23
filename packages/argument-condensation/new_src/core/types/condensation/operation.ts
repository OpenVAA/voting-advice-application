/**
 * The operations that can be chained in the condensation process (certain rules apply)
 * 
 * - REFINE: Refine the arguments
 * - MAP: Map the arguments to the question
 * - ITERATE_MAP: Iterate the mapping of the arguments
 * - REDUCE: Reduce the arguments
 * - GROUND: Ground the arguments
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
