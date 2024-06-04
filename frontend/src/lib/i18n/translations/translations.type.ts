/**
 * The record of values that may be passed to `$t` or `parse`
 * for interpolation
 */
export type TranslationsPayload = Partial<{
  adminEmail: string;
  analyticsLink: string;
  candidatePlural: string;
  candidateSingular: string;
  consentDate: Date;
  constituency: string;
  electionDate: Date;
  filters: string;
  minPasswordLength: number;
  minQuestions: number;
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
  questionsLink: string;
  rating: number;
  ratingMax: number;
  score: string | number;
  seconds: number;
  sourceUrl: string;
  timeLeft: number;
  userName: string;
  [key: string]: unknown;
}>;
