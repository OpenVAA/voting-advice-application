/**
 * The record of values that may be passed to `$t` or `parse`
 * for interpolation
 */
export type TranslationsPayload = Partial<{
  adminEmail: string;
  candidatePlural: string;
  candidateSingular: string;
  constituency: string;
  electionDate: Date;
  filters: string;
  minPasswordLength: number;
  minutes: number;
  numActiveFilters: number;
  numCandidates: number;
  numCategories: number;
  numQuestions: number;
  numShown: number;
  numStatements: number;
  numTotal: number;
  numUnansweredQuestions: number;
  openVAA: string;
  partiesTerm: string;
  partyMatchingMethod: AppSettingsGroupMatchingType;
  partyPlural: string;
  partySingular: string;
  publisher: string;
  score: string | number;
  seconds: number;
  timeLeft: number;
  userName: string;
  [key: string]: unknown;
}>;
