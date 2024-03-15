/**
 * The record of values that may be passed to `$t` or `parse`
 * for interpolation
 */
export type TranslationsPayload = Partial<{
  constituency: string;
  electionDate: Date;
  filters: string;
  minPasswordLength: number;
  userName: string;
  numCandidates: number;
  numCategories: number;
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
