export const PUBLIC_API = {
  Answer: 'api::answer.answer',
  AppCustomization: 'api::app-customization.app-customization',
  AppSettings: 'api::app-setting.app-setting',
  Candidate: 'api::candidate.candidate',
  Constituency: 'api::constituency.constituency',
  ConstituencyGroup: 'api::constituency-group.constituency-group',
  Election: 'api::election.election',
  Language: 'api::language.language',
  Nomination: 'api::nomination.nomination',
  Party: 'api::party.party',
  Question: 'api::question.question',
  QuestionCategory: 'api::question-category.question-category',
  QuestionType: 'api::question-type.question-type'
} as const;

export const PROTECTED_API = {
  User: 'plugin::users-permissions.user'
} as const;

export const API = {
  ...PUBLIC_API,
  ...PROTECTED_API
} as const;
