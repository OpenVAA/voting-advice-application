/**
 * Defines input and output characteristics for the condensation process.
 */
export const CONDENSATION_TYPE = {
  LIKERT: {
    PROS: 'likertPros',
    CONS: 'likertCons'
  }
} as const;

// Flatten the hierarchy for the type union
export type CondensationOutputType = 
  | typeof CONDENSATION_TYPE.LIKERT.PROS
  | typeof CONDENSATION_TYPE.LIKERT.CONS;