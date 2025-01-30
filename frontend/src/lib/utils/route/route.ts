const CANDIDATE = '/[[lang=locale]]/candidate';
const CANDIDATE_PROT = `${CANDIDATE}/(protected)`;
const VOTER = '/[[lang=locale]]/(voters)';
const VOTER_LOCATED = `${VOTER}/(located)`;

/**
 * Available routes and their ids.
 */
export const ROUTE = {
  // Voter App
  About: `${VOTER}/about`,
  Elections: `${VOTER}/elections`,
  Constituencies: `${VOTER}/constituencies`,
  /** The Help route is currently redirected to About */
  Help: `${VOTER}/about`,
  Home: VOTER,
  Info: `${VOTER}/info`,
  Intro: `${VOTER}/intro`,
  Privacy: `${VOTER}/privacy`,
  Question: `${VOTER_LOCATED}/questions/[questionId]`,
  QuestionCategory: `${VOTER_LOCATED}/questions/category/[categoryId]`,
  Questions: `${VOTER_LOCATED}/questions`,
  ResultCandidate: `${VOTER_LOCATED}/results/[entityType]/[entityId]`,
  ResultEntity: `${VOTER_LOCATED}/results/[entityType]/[entityId]`,
  ResultParty: `${VOTER_LOCATED}/results/[entityType]/[entityId]`,
  Results: `${VOTER_LOCATED}/results`,
  Statistics: `${VOTER_LOCATED}/results/statistics`,

  // Candidate App
  CandAppForgotPassword: `${CANDIDATE}/forgot-password`,
  CandAppHelp: `${CANDIDATE_PROT}/help`,
  CandAppHome: CANDIDATE,
  CandAppPreview: `${CANDIDATE_PROT}/preview`,
  CandAppProfile: `${CANDIDATE_PROT}/profile`,
  CandAppQuestion: `${CANDIDATE_PROT}/questions/[questionId]`,
  CandAppQuestions: `${CANDIDATE_PROT}/questions`,
  CandAppPreregister: `${CANDIDATE}/preregister`,
  CandAppLogin: `${CANDIDATE}/login`,
  /** NB! If this route is changed, make sure to update the Strapi config at backend/vaa-strapi/src/plugins/openvaa-admin-tools/server/services/email.js */
  CandAppRegister: `${CANDIDATE}/register`,
  CandAppSetPassword: `${CANDIDATE}/register/password`,
  /** NB! If this route is changed, make sure to update the Strapi config at backend/vaa-strapi/src/extensions/users-permissions/strapi-server.js */
  CandAppResetPassword: `${CANDIDATE}/password-reset`,
  CandAppSettings: `${CANDIDATE_PROT}/settings`
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
