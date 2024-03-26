/**
 * The record of values that may be passed to `$t` or `parse`
 * for interpolation
 */
export type TranslationsPayload = Partial<{
  constituency: string;
  electionDate: Date;
  filters: string;
  minPasswordLength: number;
  username: string;
  numCandidates: number;
  numCategories: number;
  numActiveFilters: number;
  numShown: number;
  numTotal: number;
  numQuestions: number;
  numStatements: number;
  numUnansweredQuestions: number;
  openVAA: string;
  partiesTerm: string;
  publisher: string;
  timeLeft: number;
  [key: string]: unknown;
}>;
