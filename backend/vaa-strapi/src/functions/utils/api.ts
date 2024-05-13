export const API = {
  Answer: 'api::answer.answer',
  AppCustomization: 'api::app-customization.app-customization',
  AppSettings: 'api::app-setting.app-setting',
  Candidate: 'api::candidate.candidate',
  Constituency: 'api::constituency.constituency',
  Election: 'api::election.election',
  Language: 'api::language.language',
  Nomination: 'api::nomination.nomination',
  Party: 'api::party.party',
  Question: 'api::question.question',
  QuestionCategory: 'api::question-category.question-category',
  QuestionType: 'api::question-type.question-type',
  User: 'plugin::users-permissions.user'
} as const;

/**
 * By default all api endpoints are cached except the following. See ../../config/plugins.ts
 */
export const NO_CACHE: ReadonlyArray<(typeof API)[keyof typeof API]> = [
  API.AppCustomization,
  API.AppSettings,
  API.User
] as const;
