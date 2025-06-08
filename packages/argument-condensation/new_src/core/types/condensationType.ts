/**
 * Defines input and output characteristics for the condensation process.
 */
export const CONDENSATION_TYPE = {
  LIKERT: {
    PROS: 'likertPros',
    CONS: 'likertCons'
  },
  CATEGORICAL: 'categorical'
} as const;

// Flatten the hierarchy for the type union
export type CondensationType = 
  | typeof CONDENSATION_TYPE.LIKERT.PROS
  | typeof CONDENSATION_TYPE.LIKERT.CONS  
  | typeof CONDENSATION_TYPE.CATEGORICAL;

/**
 * Helper to determine if a condensation type is Likert-based
 */
export function isLikertCondensation(type: CondensationType): boolean {
  return type === CONDENSATION_TYPE.LIKERT.PROS || type === CONDENSATION_TYPE.LIKERT.CONS;
}

/**
 * Helper to determine if a condensation type is categorical
 */
export function isCategoricalCondensation(type: CondensationType): boolean {
  return type === CONDENSATION_TYPE.CATEGORICAL;
}