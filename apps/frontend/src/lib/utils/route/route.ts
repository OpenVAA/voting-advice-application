const CANDIDATE = '/candidate';
const CANDIDATE_PROT = `${CANDIDATE}/(protected)`;
const VOTER = '/(voters)';
const VOTER_LOCATED = `${VOTER}/(located)`;
const ADMIN = '/admin';
const ADMIN_PROT = `${ADMIN}/(protected)`;

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
  Nominations: `${VOTER}/nominations`,
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
  CandAppHelp: `${CANDIDATE}/help`,
  CandAppHome: CANDIDATE,
  CandAppPreview: `${CANDIDATE_PROT}/preview`,
  CandAppPrivacy: `${CANDIDATE}/privacy`,
  CandAppProfile: `${CANDIDATE_PROT}/profile`,
  CandAppQuestion: `${CANDIDATE_PROT}/questions/[questionId]`,
  CandAppQuestions: `${CANDIDATE_PROT}/questions`,
  CandAppPreregister: `${CANDIDATE}/preregister`,
  CandAppPreregisterIdentityProviderCallback: '/api/oidc/callback',
  CandAppPreregisterElection: `${CANDIDATE}/preregister/elections`,
  CandAppPreregisterConstituency: `${CANDIDATE}/preregister/constituencies`,
  CandAppPreregisterEmail: `${CANDIDATE}/preregister/email`,
  CandAppPreregisterStatus: `${CANDIDATE}/preregister/status`,
  CandAppLogin: `${CANDIDATE}/login`,
  CandAppRegister: `${CANDIDATE}/register`,
  CandAppSetPassword: `${CANDIDATE}/register/password`,
  CandAppResetPassword: `${CANDIDATE}/password-reset`,
  CandAppSettings: `${CANDIDATE_PROT}/settings`,

  // Admin App
  AdminAppHome: ADMIN,
  AdminAppJob: `${ADMIN_PROT}/jobs/[jobId]`,
  AdminAppJobs: `${ADMIN_PROT}/jobs`,
  AdminAppFactorAnalysis: `${ADMIN_PROT}/factor-analysis`,
  AdminAppQuestionInfo: `${ADMIN_PROT}/question-info`,
  AdminAppArgumentCondensation: `${ADMIN_PROT}/argument-condensation`,
  AdminAppLogin: `${ADMIN}/login`
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
