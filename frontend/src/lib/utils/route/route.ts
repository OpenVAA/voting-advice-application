const VOTER = '/[[lang=locale]]/(voters)';
const LOCATED = `${VOTER}/(located)`;

/**
 * Available routes and their ids.
 */
export const ROUTE = {
  About: `${VOTER}/about`,
  Elections: `${VOTER}/elections`,
  Constituencies: `${VOTER}/constituencies`,
  /** The Help route is currently redirected to About */
  Help: `${VOTER}/about`,
  Home: VOTER,
  Info: `${VOTER}/info`,
  Intro: `${VOTER}/intro`,
  Privacy: `${VOTER}/privacy`,
  Question: `${LOCATED}/questions/[questionId]`,
  QuestionCategory: `${LOCATED}/questions/category/[categoryId]`,
  Questions: `${LOCATED}/questions`,
  ResultCandidate: `${LOCATED}/results/[entityType]/[entityId]`,
  ResultEntity: `${LOCATED}/results/[entityType]/[entityId]`,
  ResultParty: `${LOCATED}/results/[entityType]/[entityId]`,
  Results: `${LOCATED}/results`,
  Statistics: `${LOCATED}/results/statistics`

  // CandAppFAQ: 'candidate/faq',
  // CandAppFeedback: 'candidate/feedback',
  // CandAppForgotPassword: 'candidate/forgot-password',
  // CandAppHelp: 'candidate/help',
  // CandAppHome: 'candidate',
  // CandAppInfo: 'candidate/info',
  // CandAppPreview: 'candidate/preview',
  // CandAppProfile: 'candidate/profile',
  // CandAppQuestions: 'candidate/questions',
  // CandAppQuestionEdit: 'candidate/questions/edit',
  // /** NB! If this route is changed, make sure to update the Strapi config at backend/vaa-strapi/src/plugins/candidate-admin/server/services/email.js */
  // CandAppRegister: 'candidate/register',
  // /** NB! If this route is changed, make sure to update the Strapi config at backend/vaa-strapi/src/extensions/users-permissions/strapi-server.js */
  // CandAppResetPassword: 'candidate/password-reset',
  // CandAppSettings: 'candidate/settings',
} as const;

/**
 * Any allowed route.
 */
export type Route = keyof typeof ROUTE;

/**
 * A special id used to mark the question to start from before question ids are available
 */
export const FIRST_QUESTION_ID = '__first__';

/**
 * Route parameters automatically added to certain routes.
 */
export const DEFAULT_PARAMS: Partial<Record<Route, Record<string, string>>> = {
  Question: { questionId: FIRST_QUESTION_ID },
  ResultCandidate: { entityType: 'candidate' },
  ResultParty: { entityType: 'organization' }
};
