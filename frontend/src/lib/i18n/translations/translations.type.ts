/**
 * The record of values that may be passed to `$t` or `parse`
 * for interpolation
 */
export type TranslationsPayload = Partial<{
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
  publisher: string;
  seconds: number;
  timeLeft: number;
  username: string;
  [key: string]: unknown;
}>;
