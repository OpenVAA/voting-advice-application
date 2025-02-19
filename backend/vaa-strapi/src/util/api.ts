import type { UID } from '@strapi/strapi';

/**
 * These API listings are used for automated tasks targeting all APIs, including creating default read permissions.
 * With `strapi.documents('api::answer.answer')` you must, however, use literal strings to get proper typing.
 */
export const CONTENT_API: {
  [name: string]: UID.ContentType;
} = {
  Alliance: 'api::alliance.alliance',
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

export const PUBLIC_API: {
  [name: string]: UID.ContentType;
} = {
  AppCustomization: 'api::app-customization.app-customization',
  AppSettings: 'api::app-setting.app-setting',
  ...CONTENT_API
} as const;

export const PROTECTED_API: {
  [name: string]: UID.ContentType;
} = {
  User: 'plugin::users-permissions.user'
} as const;

export const API: {
  [name: string]: UID.ContentType;
} = {
  ...PUBLIC_API,
  ...PROTECTED_API
} as const;
