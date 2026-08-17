/**
 * The record of values that may be passed to `$t` or `parse`
 * for interpolation
 */
export type TranslationsPayload = Partial<{
  analyticsLink: string;
  consentDate: Date;
  constituency: string;
  constituencyGroup: string;
  electionDate: Date;
  filters: string;
  maxFilesize: number;
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
  option: string;
  organization: string;
  partiesTerm: string;
  partyMatchingMethod: AppSettings['matching']['organizationMatching'];
  publisher: string;
  questionsLink: string;
  rating: number;
  ratingMax: number;
  score: string | number;
  seconds: number;
  sourceUrl: string;
  timeLeft: number;
  username: string;
  [key: string]: unknown;
}>;
