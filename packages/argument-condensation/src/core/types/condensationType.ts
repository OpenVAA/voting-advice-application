export const CONDENSATION_TYPE = {
  General: 'general',
  Supporting: 'supporting',
  Opposing: 'opposing'
} as const;

export type CondensationType = (typeof CONDENSATION_TYPE)[keyof typeof CONDENSATION_TYPE];
