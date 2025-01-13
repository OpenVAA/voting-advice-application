/**
 * The allowed routes
 */
export const ROUTE = {
  About: 'about',
  CandAppFAQ: 'candidate/faq',
  CandAppFeedback: 'candidate/feedback',
  CandAppForgotPassword: 'candidate/forgot-password',
  CandAppHelp: 'candidate/help',
  CandAppHome: 'candidate',
  CandAppInfo: 'candidate/info',
  CandAppPreview: 'candidate/preview',
  CandAppProfile: 'candidate/profile',
  CandAppQuestionsError: 'candidate/questions/error',
  CandAppQuestions: 'candidate/questions',
  CandAppLogin: 'candidate/login',
  /** NB! If this route is changed, make sure to update the Strapi config at backend/vaa-strapi/src/plugins/candidate-admin/server/services/email.js */
  CandAppRegister: 'candidate/register',
  CandAppSetPassword: 'candidate/register/password',
  /** NB! If this route is changed, make sure to update the Strapi config at backend/vaa-strapi/src/extensions/users-permissions/strapi-server.js */
  CandAppResetPassword: 'candidate/password-reset',
  CandAppSettings: 'candidate/settings',
  Candidate: 'candidates',
  Candidates: 'candidates',
  /** The Help route is currently redirected to About */
  Help: 'about',
  Home: '',
  Info: 'info',
  Intro: 'intro',
  Parties: 'parties',
  Party: 'parties',
  Privacy: 'privacy',
  Question: 'questions',
  QuestionError: 'questions/error',
  QuestionCategory: 'questions/category',
  Questions: 'questions',
  ResultCandidate: 'results/candidate',
  ResultParty: 'results/party',
  Results: 'results',
  Statistics: 'results/statistics',
  _Test: '_test'
} as const;

export type Route = (typeof ROUTE)[keyof typeof ROUTE];
