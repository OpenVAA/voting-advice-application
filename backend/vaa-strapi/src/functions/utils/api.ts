export enum API {
  Answer = 'api::answer.answer',
  AppLabel = 'api::election-app-label.election-app-label',
  AppSettings = 'api::app-setting.app-setting',
  Candidate = 'api::candidate.candidate',
  Constituency = 'api::constituency.constituency',
  Election = 'api::election.election',
  Gender = 'api::gender.gender',
  Language = 'api::language.language',
  Nomination = 'api::nomination.nomination',
  Party = 'api::party.party',
  Question = 'api::question.question',
  QuestionCategory = 'api::question-category.question-category',
  QuestionType = 'api::question-type.question-type',
  User = 'plugin::users-permissions.user'
}

/**
 * By default all api endpoints are cached except the following. See ../../config/plugins.ts
 */
export const NO_CACHE = [API.AppLabel, API.AppSettings, API.User];
