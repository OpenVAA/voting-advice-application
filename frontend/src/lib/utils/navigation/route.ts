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
  CandAppRegister = 'candidate/register',
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
  Questions = 'questions',
  ResultCandidate = 'results/candidate',
  ResultParty = 'results/party',
  Results = 'results',
  Statistics = 'results/statistics',
  _Test = '_test'
}
