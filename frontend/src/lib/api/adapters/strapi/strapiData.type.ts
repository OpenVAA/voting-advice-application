/////////////////////////////////////////////////////////////////////
// GENERAL TYPES
/////////////////////////////////////////////////////////////////////

import type { DynamicSettings } from '@openvaa/app-shared';

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
  data: null;
  error: {
    details: unknown;
    message: string;
    name: string;
    status: number;
  };
}

/**
 * The base format for all Strapi objects
 */
export interface StrapiObject<TAttributes extends object = object> {
  id: string;
  locale: string;
  attributes: TAttributes;
}

/**
 * Format for multiple relations which may or may not be populated.
 */
export type StrapiRelation<TTarget extends StrapiObject> =
  | {
      data: Array<TTarget>;
    }
  | undefined;

/**
 * Format for single relations which may or may not be populated.
 */
export type StrapiSingleRelation<TTarget extends StrapiObject> =
  | {
      data: TTarget;
    }
  | undefined;

/**
 * Format for images which may or may not be populated.
 */
export type StrapiImage =
  | {
      data: {
        id: number | string;
        attributes: StrapiImageData;
      };
    }
  | undefined;

export interface StrapiImageData extends StrapiImageFormatData {
  alternativeText?: string;
  caption?: string;
  formats: {
    thumbnail?: StrapiImageFormatData;
    small?: StrapiImageFormatData;
    medium?: StrapiImageFormatData;
    large?: StrapiImageFormatData;
  };
}

export interface StrapiImageFormatData {
  ext: string;
  height?: number;
  name: string;
  size?: number;
  url: string;
  width?: number;
}

/**
 * Format for data localized in Strapi
 */
export type LocalizedStrapiData<TData> = TData & {
  attributes: {
    localizations: {
      data: Array<TData>;
    };
  };
};

type DateString = string;

/////////////////////////////////////////////////////////////////////
// COLLECTION CONTENT-TYPES
// NB. The typings are non-exhaustive
/////////////////////////////////////////////////////////////////////

export type StrapiElectionData = StrapiObject<{
  answersLocked: boolean;
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
  settings: StrapiQuestionTypeSettings;
}>;

export type StrapiQuestionTypeSettings =
  | {
      type: 'text';
      notLocalizable?: boolean;
    }
  | {
      type: 'number';
      min?: number;
      max?: number;
    }
  | {
      type: 'boolean';
    }
  // Not supported yet
  // | {
  //     type: 'photo';
  //   }
  | {
      type: 'date';
      dateType?: StrapiDateType;
      min?: DateString;
      max?: DateString;
    }
  | {
      type: 'link';
    }
  | {
      type: 'singleChoiceOrdinal';
      values: Array<StrapiChoice>;
      display?: 'vertical' | 'horizontal';
    }
  | {
      type: 'singleChoiceCategorical';
      values: Array<StrapiChoice>;
      display?: 'vertical' | 'horizontal';
    }
  | {
      type: 'multipleChoiceCategorical';
      values: Array<StrapiChoice>;
      display?: 'vertical' | 'horizontal';
      min?: number;
      max?: number;
    };
// Not supported yet
// | {
//     type: 'preferenceOrder';
//     values: Array<StrapiChoice>;
//     min?: number;
//     max?: number;
//   };

export type StrapiDateType = 'yearMonthDay' | 'yearMonth' | 'monthDay' | 'month' | 'weekday';

export type StrapiChoice = {
  key: number;
  label: LocalizedString;
};

export type StrapiQuestionData = StrapiObject<{
  allowOpen: boolean | null;
  customData?: object | null;
  entityType: 'all' | 'candidate' | 'party' | null;
  fillingInfo: LocalizedString;
  filterable: boolean | null;
  info: LocalizedString;
  order: number | null;
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
}>;

export type StrapiCandidateData = StrapiObject<{
  firstName: string;
  lastName: string;
  photo: StrapiImage;
  answers: StrapiRelation<StrapiAnswerData>;
  nomination: StrapiSingleRelation<StrapiNominationData>;
  party: StrapiSingleRelation<StrapiPartyData>;
}>;

export type StrapiAnswerData = StrapiObject<{
  openAnswer: LocalizedString | null;
  value: StrapiAnswerValues[keyof StrapiAnswerValues];
  candidate: StrapiSingleRelation<StrapiCandidateData>;
  party: StrapiSingleRelation<StrapiPartyData>;
  question: StrapiSingleRelation<StrapiQuestionData>;
}>;

/**
 * The allowed `Answer` values for different `QuestionType`s based on their
 * `settings.type`.
 */
export type StrapiAnswerValues = {
  boolean: boolean;
  date: DateString;
  multipleChoiceCategorical: Array<StrapiChoice['key']>;
  number: number;
  photo: string;
  preferenceOrder: Array<StrapiChoice['key']>;
  singleChoiceCategorical: StrapiChoice['key'];
  singleChoiceOrdinal: StrapiChoice['key'];
  text: string | LocalizedString;
};

export type StrapiPartyData = StrapiObject<{
  color: string;
  colorDark: string;
  info: LocalizedString;
  logo: StrapiImage;
  name: LocalizedString;
  shortName: LocalizedString;
  answers: StrapiRelation<StrapiAnswerData>;
  candidates: StrapiRelation<StrapiCandidateData>;
  nominations: StrapiRelation<StrapiNominationData>;
}>;

export type StrapiFeedbackData = StrapiObject<{
  date?: DateString;
  description?: string;
  rating?: number;
  url?: string;
  userAgent?: string;
}>;
