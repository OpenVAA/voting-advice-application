
/**
 * The operations that can be chained in the condensation process (certain rules apply).
 */
export enum CondensationOperations {
  REFINE = 'REFINE',
  MAP = 'MAP',
  REDUCE = 'REDUCE',
  GROUND = 'GROUND'
}

/**
 * The type of the operations that can be chained in the condensation process.
 */
export type CondensationOperation = keyof typeof CondensationOperations;
