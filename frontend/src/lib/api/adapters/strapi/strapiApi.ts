import type {
  StrapiAppCustomizationData,
  StrapiAppSettingsData,
  StrapiBasicUserData,
  StrapiCandidateData,
  StrapiCandidateUserData,
  StrapiCheckRegistrationData,
  StrapiConstituencyData,
  StrapiConstituencyGroupData,
  StrapiElectionData,
  StrapiFeedbackData,
  StrapiImageData,
  StrapiLoginData,
  StrapiNominationData,
  StrapiPartyData,
  StrapiQuestionCategoryData,
  StrapiQuestionData,
  StrapiQuestionTypeData,
  StrapiRegisterData,
  StrapiUpdateCandidateReturnData
} from './strapiData.type';

export const STRAPI_API: Record<keyof StrapiApiReturnType, string> = {
  // DataProvider
  appSettings: 'api/app-setting',
  appCustomization: 'api/app-customization',
  candidates: 'api/candidates',
  constituencies: 'api/constituencies',
  constituencyGroups: 'api/constituency-groups',
  elections: 'api/elections',
  nominations: 'api/nominations',
  parties: 'api/parties',
  questions: 'api/questions',
  questionTypes: 'api/question-types',
  questionCategories: 'api/question-categories',
  // FeedbackWriter
  setFeedback: 'api/feedbacks',
  // DataWriter
  basicUserData: 'api/users/me',
  candidateUserData: 'api/users/me',
  checkRegistrationKey: 'api/auth/candidate/check',
  forgotPassword: 'api/auth/forgot-password',
  login: 'api/auth/local',
  overwriteAnswers: 'api/candidate/:id/overwrite-answers',
  registerCandidate: 'api/auth/candidate/register',
  preregisterCandidate: 'api/auth/candidate/preregister',
  resetPassword: 'api/auth/reset-password',
  setProperties: 'api/candidate/:id/update-properties',
  setPassword: 'api/auth/change-password',
  upload: 'api/upload',
  updateAnswers: 'api/candidate/:id/update-answers'
} as const;

export type StrapiApi = keyof StrapiApiReturnType;

/**
 * The Strapi data types returned by the Strapi API.
 */
export type StrapiApiReturnType = {
  // DataProvider
  appSettings: StrapiAppSettingsData; // Single type
  appCustomization: StrapiAppCustomizationData; // Single type
  candidates: Array<StrapiCandidateData>;
  constituencies: Array<StrapiConstituencyData>;
  constituencyGroups: Array<StrapiConstituencyGroupData>;
  elections: Array<StrapiElectionData>;
  nominations: Array<StrapiNominationData>;
  parties: Array<StrapiPartyData>;
  questions: Array<StrapiQuestionData>;
  questionTypes: Array<StrapiQuestionTypeData>;
  questionCategories: Array<StrapiQuestionCategoryData>;
  // FeedbackWriter
  setFeedback: StrapiFeedbackData;
  // DataWriter
  basicUserData: StrapiBasicUserData;
  candidateUserData: StrapiCandidateUserData;
  checkRegistrationKey: StrapiCheckRegistrationData;
  forgotPassword: unknown;
  login: StrapiLoginData;
  overwriteAnswers: StrapiUpdateCandidateReturnData;
  registerCandidate: StrapiRegisterData;
  preregisterCandidate: StrapiCandidateData; // TODO!!!
  resetPassword: unknown;
  setProperties: StrapiUpdateCandidateReturnData;
  setPassword: unknown;
  upload: Array<StrapiImageData>;
  updateAnswers: StrapiUpdateCandidateReturnData;
};

/**
 * Those Strapi API endpoints whose returned data is contained in the root of the response instead of the `data` property. This is handled by `StrapiAdapter`.
 */
export const STRAPI_AUTH_APIS = Object.entries(STRAPI_API)
  .filter(([, v]) => v.startsWith('api/auth') || v.startsWith('api/users') || v.startsWith('api/upload'))
  .map(([k]) => k as StrapiApi);
