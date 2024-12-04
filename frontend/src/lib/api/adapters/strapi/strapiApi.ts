import type {
  StrapiAnswerData,
  StrapiAppCustomizationData,
  StrapiAppSettingsData,
  StrapiCandidateData,
  StrapiConstituencyData,
  StrapiConstituencyGroupData,
  StrapiElectionData,
  StrapiFeedbackData,
  StrapiNominationData,
  StrapiPartyData,
  StrapiQuestionCategoryData,
  StrapiQuestionData,
  StrapiQuestionTypeData
} from './strapiData.type';

export const STRAPI_API: Record<keyof StrapiApiReturnType, string> = {
  answers: 'api/answers',
  appSettings: 'api/app-settings',
  appCustomization: 'api/app-customization',
  candidates: 'api/candidates',
  constituencies: 'api/constituencies',
  constituencyGroups: 'api/constituency-groups',
  feedbacks: 'api/feedbacks',
  elections: 'api/elections',
  nominations: 'api/nominations',
  parties: 'api/parties',
  questions: 'api/questions',
  questionTypes: 'api/question-types',
  questionCategories: 'api/question-categories'
} as const;

export type StrapiApi = keyof StrapiApiReturnType;

/**
 * The Strapi data types returned by the Strapi API.
 */
export type StrapiApiReturnType = {
  answers: Array<StrapiAnswerData>;
  appSettings: Array<StrapiAppSettingsData>;
  appCustomization: StrapiAppCustomizationData; // NB. A single type
  candidates: Array<StrapiCandidateData>;
  constituencies: Array<StrapiConstituencyData>;
  constituencyGroups: Array<StrapiConstituencyGroupData>;
  feedbacks: Array<StrapiFeedbackData>;
  elections: Array<StrapiElectionData>;
  nominations: Array<StrapiNominationData>;
  parties: Array<StrapiPartyData>;
  questions: Array<StrapiQuestionData>;
  questionTypes: Array<StrapiQuestionTypeData>;
  questionCategories: Array<StrapiQuestionCategoryData>;
};
