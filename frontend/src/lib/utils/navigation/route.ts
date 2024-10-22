/**
 * The allowed routes
 */

export enum Route {
  About = 'about',
  CandAppFAQ = 'candidate/faq',
  CandAppFeedback = 'candidate/feedback',
  CandAppForgotPassword = 'candidate/forgot-password',
  CandAppHelp = 'candidate/help',
  CandAppHome = 'candidate',
  CandAppInfo = 'candidate/info',
  CandAppPreview = 'candidate/preview',
  CandAppProfile = 'candidate/profile',
  CandAppQuestions = 'candidate/questions',
  CandAppQuestionEdit = 'candidate/questions/edit',
  /** NB! If this route is changed, make sure to update the Strapi config at backend/vaa-strapi/src/plugins/candidate-admin/server/services/email.js */
  CandAppRegister = 'candidate/register',
  /** NB! If this route is changed, make sure to update the Strapi config at backend/vaa-strapi/src/extensions/users-permissions/strapi-server.js */
  CandAppResetPassword = 'candidate/password-reset',
  CandAppSettings = 'candidate/settings',
  Candidate = 'candidates',
  Candidates = 'candidates',
  /** The Help route is currently redirected to About */
  Help = 'about',
  Home = '',
  Info = 'info',
  Intro = 'intro',
  Parties = 'parties',
  Party = 'parties',
  Privacy = 'privacy',
  Question = 'questions',
  QuestionCategory = 'questions/category',
  QuestionError = 'questions/error',
  Questions = 'questions',
  ResultCandidate = 'results/candidate',
  ResultParty = 'results/party',
  Results = 'results',
  Statistics = 'results/statistics',
  _Test = '_test'
}
