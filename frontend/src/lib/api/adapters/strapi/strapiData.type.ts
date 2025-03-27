/////////////////////////////////////////////////////////////////////
// GENERAL TYPES
/////////////////////////////////////////////////////////////////////

import type { DynamicSettings, LocalizedAnswer, QuestionTypeSettings } from '@openvaa/app-shared';

/**
 * The basic format for Strapi responses
 */
export type StrapiResponse<TData> = {
  data: TData;
};

/**
 * A Strapi error containing an error
 */
export interface StrapiError {
  data?: null;
  error: {
    details: unknown;
    message: string;
    name: string;
    status: number;
  };
}

/**
 * The base format for all Strapi objects.
 * NB. The objects also have a numeric `id` but we don't want to use it.
 */
export type StrapiObject<TProperties extends object = object> = TProperties & {
  documentId: string;
  locale: string;
};

/**
 * Format for multiple relations which may or may not be populated.
 */
export type StrapiRelation<TTarget extends StrapiObject> = Array<TTarget> | null | undefined;

/**
 * Format for single relations which may or may not be populated.
 */
export type StrapiSingleRelation<TTarget extends StrapiObject> = TTarget | null | undefined;

/**
 * Format for images which may or may not be populated.
 */
export type StrapiImage = StrapiImageData | null | undefined;

export type StrapiImageData = StrapiImageFormatData &
  StrapiObject<{
    id: string | number;
    alternativeText?: string;
    caption?: string;
    formats: {
      thumbnail?: StrapiImageFormatData;
      small?: StrapiImageFormatData;
      medium?: StrapiImageFormatData;
      large?: StrapiImageFormatData;
    };
  }>;

export interface StrapiImageFormatData {
  ext: string;
  height?: number;
  name: string;
  size?: number;
  url: string;
  width?: number;
}

type DateString = string;

/////////////////////////////////////////////////////////////////////
// COLLECTION CONTENT-TYPES
// NB. The typings are non-exhaustive
/////////////////////////////////////////////////////////////////////

export type StrapiElectionData = StrapiObject<{
  electionDate: DateString;
  electionStartDate: DateString;
  electionType: 'local' | 'presidential' | 'congress' | null;
  info: LocalizedString;
  name: LocalizedString;
  organizer: LocalizedString;
  shortName: LocalizedString;
  constituencyGroups: StrapiRelation<StrapiConstituencyGroupData>;
  nominations: StrapiRelation<StrapiNominationData>;
  questionCategories: StrapiRelation<StrapiQuestionCategoryData>;
}>;

export type StrapiAppSettingsData = StrapiObject<DynamicSettings>;

export type StrapiAppCustomizationData = StrapiObject<{
  candPoster: StrapiImage;
  candPosterDark: StrapiImage;
  poster: StrapiImage;
  posterDark: StrapiImage;
  publisherName: LocalizedString | null;
  publisherLogo: StrapiImage;
  publisherLogoDark: StrapiImage;
  // The return types for `candidateAppFAQ` and `translationOverrides` are different from the schema because they're preprocessed before returning
  candidateAppFAQ: { [locale: string]: Array<{ question: string; answer: string }> };
  translationOverrides: { [locale: string]: { [translationKey: string]: string } };
}>;

export type StrapiQuestionTypeData = StrapiObject<{
  info: string;
  name: string;
  settings: QuestionTypeSettings;
}>;

export type StrapiQuestionData = StrapiObject<{
  allowOpen: boolean | null;
  customData?: object | null;
  entityType: 'all' | 'candidate' | 'party' | null;
  fillingInfo: LocalizedString;
  filterable: boolean | null;
  info: LocalizedString;
  order: number | null;
  required: boolean | null;
  shortName: LocalizedString;
  text: LocalizedString;
  category: StrapiSingleRelation<StrapiQuestionCategoryData>;
  constituencies: StrapiRelation<StrapiConstituencyData>;
  questionType: StrapiSingleRelation<StrapiQuestionTypeData>;
}>;

export type StrapiQuestionCategoryData = StrapiObject<{
  color: string;
  colorDark: string;
  customData?: object | null;
  emoji: string;
  info: LocalizedString;
  name: LocalizedString;
  order: number | null;
  shortName: LocalizedString;
  type: 'info' | 'opinion';
  constituencies: StrapiRelation<StrapiConstituencyData>;
  elections: StrapiRelation<StrapiElectionData>;
  questions: StrapiRelation<StrapiQuestionData>;
}>;

export type StrapiNominationData = StrapiObject<{
  electionRound: number;
  electionSymbol: string;
  candidate: StrapiSingleRelation<StrapiCandidateData>;
  constituency: StrapiSingleRelation<StrapiConstituencyData>;
  election: StrapiSingleRelation<StrapiElectionData>;
  party: StrapiSingleRelation<StrapiPartyData>;
  unconfirmed: boolean | null;
}>;

export type StrapiConstituencyGroupData = StrapiObject<{
  info: LocalizedString;
  name: LocalizedString;
  shortName: LocalizedString;
  subtype: string;
  constituencies: StrapiRelation<StrapiConstituencyData>;
}>;

export type StrapiConstituencyData = StrapiObject<{
  info: LocalizedString;
  keywords: LocalizedString;
  name: LocalizedString;
  shortName: LocalizedString;
  nominations: StrapiRelation<StrapiNominationData>;
  parent: StrapiSingleRelation<StrapiConstituencyData>;
  /**
   * This is the reverse of `parent` and not normally used.
   */
  constituencies: StrapiRelation<StrapiConstituencyData>;
}>;

export type StrapiCandidateData = StrapiObject<{
  firstName: string;
  lastName: string;
  image: StrapiImage;
  answers: StrapiAnswers | null;
  nominations: StrapiRelation<StrapiNominationData>;
  party: StrapiSingleRelation<StrapiPartyData>;
}>;

export type StrapiPartyData = StrapiObject<{
  color: string;
  colorDark: string;
  info: LocalizedString;
  image: StrapiImage;
  name: LocalizedString;
  shortName: LocalizedString;
  answers: StrapiAnswers | null;
  candidates: StrapiRelation<StrapiCandidateData>;
  nominations: StrapiRelation<StrapiNominationData>;
}>;

export type StrapiAnswers = { [questionId: string]: LocalizedAnswer };

export type StrapiFeedbackData = StrapiObject<{
  date?: DateString;
  description?: string;
  rating?: number;
  url?: string;
  userAgent?: string;
}>;

/////////////////////////////////////////////////////////////////////
// DATA WRITER RETURN TYPES
// NB. The typings are non-exhaustive
// NB. The auth routes return the data in the root of the response
// body instead of `data` like the public routes
/////////////////////////////////////////////////////////////////////

export type StrapiAuthResponse<TData> = TData;

export type StrapiRoleData = StrapiObject<{
  name: string;
  description: string;
  type: string;
}>;

export type StrapiUserProperties = {
  username: string;
  email: string;
  confirmed: boolean;
  blocked: boolean;
  role?: StrapiSingleRelation<StrapiRoleData>;
};

export type StrapiBasicUserData = StrapiObject<StrapiUserProperties>;

export type StrapiCandidateUserData = StrapiObject<
  StrapiUserProperties & {
    candidate: StrapiSingleRelation<StrapiCandidateData>;
  }
>;

export type StrapiCheckRegistrationData = {
  email: string;
  firstName: string;
  lastName: string;
};

export type StrapiLoginData = {
  jwt: string;
};

export type StrapiRegisterData = {
  type: 'success';
};

/**
 * The custom candidate update API routes explicitly populate only some relations of the candidate object.
 */
export type StrapiUpdateCandidateReturnData = Omit<StrapiCandidateData, 'nominations' | 'party'>;
