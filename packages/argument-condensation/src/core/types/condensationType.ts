export const CONDENSATION_TYPE = {
    GENERAL: 'general',
    SUPPORTING: 'supporting',
    OPPOSING: 'opposing'
} as const;

export type CondensationType = (typeof CONDENSATION_TYPE)[keyof typeof CONDENSATION_TYPE];

