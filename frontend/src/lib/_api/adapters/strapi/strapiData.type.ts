/**
 * The Strapi data types matching the DataProvider collections
 */
export type StrapiCollectionTypes = {
  candidates: StrapiCandidateData;
  constituencies: StrapiConstituencyData;
  elections: StrapiElectionData;
  nominations: StrapiNominationData;
};

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
 * Non-exhaustive specification of the data returned by the Strapi endpoint `i18n/locales`.
 * Note that the data is not contained in a typical `StrapiResponse`.
 */
export interface StrapiLocaleData {
  id: number;
  code: string;
  isDefault: boolean;
  name: string;
}

/**
 * The format in which the locales are internally stored in the `getData` module
 */
export interface LocaleProps {
  code: string;
  isDefault?: boolean;
}

/**
 * Format for data localized in Strapi
 */
export type LocalizedStrapiData<T> = T & {
  attributes: {
    localizations: {
      data: T[];
    };
  };
};

/**
 * Non-exhaustive specification of the data returned by the Strapi endpoint `election`.
 * Currently we're only interested in the appLabels id.
 */
export type StrapiElectionData = StrapiObject<{
  electionDate: Date;
  canEditQuestions: boolean;
  electionStartDate: Date;
  name: LocalizedString;
  shortName: LocalizedString;
  organizer: LocalizedString;
  info: LocalizedString;
  electionType: string | null;
  electionAppLabel: {
    data: LocalizedStrapiData<StrapiAppLabelsData>;
  };
  constituencies: {
    data: StrapiConstituencyData[];
  };
}>;

/**
 * Non-exhaustive specification of the app labels
 */
export type StrapiAppLabelsData = StrapiObject<{
  locale: string;
  actionLabels: {
    id: string;
    electionInfo: string;
    help: string;
    home: string;
    howItWorks: string;
    opinions: string;
    results: string;
    startButton: string;
    startQuestions: string;
    yourList: string;
  };
  viewTexts: {
    id: string;
    appTitle: string;
    frontpageIngress: string;
    madeWith: string;
    publishedBy: string;
    questionsTip: string;
    yourOpinionsIngress: string;
    yourOpinionsTitle: string;
  };
}>;

/**
 * Non-exhaustive specification of app settings
 */
export type StrapiAppSettingsData = StrapiObject<{
  publisherName: LocalizedString | null;
  publisherLogo: {
    data?: {
      id: number | string;
      attributes: StrapiImageData;
    };
  };
  publisherLogoDark: {
    data?: {
      id: number | string;
      attributes: StrapiImageData;
    };
  };
  poster: {
    data?: {
      id: number | string;
      attributes: StrapiImageData;
    };
  };
  posterCandidateApp: {
    data?: {
      id: number | string;
      attributes: StrapiImageData;
    };
  };
  underMaintenance?: boolean;
}>;

/**
 * Non-exhaustive specification of the data returned by the Strapi endpoint `question-type`.
 */
export type StrapiQuestionTypeData = StrapiObject<{
  name: string;
  info: string;
  settings: QuestionTypeSettings;
  questions: {
    data: StrapiQuestionData[];
  };
}>;

/**
 * Question type settings
 */
export type QuestionTypeSettings =
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
  | {
      type: 'photo';
    }
  | {
      type: 'date';
      dateType?: DateType;
      min?: Date;
      max?: Date;
    }
  | {
      type: 'link';
    }
  | {
      type: 'singleChoiceOrdinal';
      values: Choice[];
      display?: 'vertical' | 'horizontal';
    }
  | {
      type: 'singleChoiceCategorical';
      values: Choice[];
      display?: 'vertical' | 'horizontal';
    }
  | {
      type: 'multipleChoiceCategorical';
      values: Choice[];
      display?: 'vertical' | 'horizontal';
      min?: number;
      max?: number;
    }
  | {
      type: 'preferenceOrder';
      values: Choice[];
      min?: number;
      max?: number;
    };

/**
 * The format for an option in a multiple choice question.
 */
export type Choice = {
  key: number;
  label: LocalizedString;
};

/**
 * Non-exhaustive specification of the data returned by the Strapi endpoint `question`.
 */
export type StrapiQuestionData = StrapiObject<{
  allowOpen: boolean | null;
  constituencies: {
    data: StrapiConstituencyData[];
  };
  questionType: {
    data: StrapiQuestionTypeData;
  };
  entityType: EntityType | null;
  text: LocalizedString;
  shortName: LocalizedString;
  info: LocalizedString;
  fillingInfo: LocalizedString;
  filterable: boolean | null;
  order: number | null;
  category: {
    data: StrapiQuestionCategoryData;
  };
  customData: JSONData;
}>;

/**
 * Non-exhaustive specification of the data returned by the Strapi endpoint `question-category`.
 */
export type StrapiQuestionCategoryData = StrapiObject<{
  name: LocalizedString;
  shortName: LocalizedString;
  info: LocalizedString;
  order: number | null;
  color: string;
  colorDark: string;
  type: QuestionCategoryType;
  election: {
    data: StrapiElectionData;
  };
  questions: {
    data: StrapiQuestionData[];
  };
  customData: JSONData;
}>;

/**
 * Non-exhaustive specification of the data returned by the Strapi endpoint `nomination`.
 */
export type StrapiNominationData = StrapiObject<{
  electionSymbol: string;
  electionRound: number;
  type?: string;
  candidate: {
    data: StrapiCandidateData;
  };
  constituency: {
    data: StrapiConstituencyData;
  };
  election: {
    data: StrapiElectionData;
  };
  party: {
    data: StrapiPartyData;
  };
}>;

/**
 * Non-exhaustive specification of the data returned by the Strapi endpoint `constitucency`.
 */
export type StrapiConstituencyData = StrapiObject<{
  name: LocalizedString;
  shortName: LocalizedString;
  info: LocalizedString;
  type: string | null;
  nominations: {
    data: StrapiNominationData[];
  };
}>;

/**
 * Non-exhaustive specification of the data returned by the Strapi endpoint `candidate`.
 */
export type StrapiCandidateData = StrapiObject<{
  answers: {
    data: StrapiAnswerData[];
  };
  firstName: string;
  lastName: string;
  party: {
    data: StrapiPartyData;
  };
  photo: {
    data?: {
      id: number | string;
      attributes: StrapiImageData;
    };
  };
}>;

export type StrapiAnswerData = StrapiObject<{
  value: AnswerValues[keyof AnswerValues];
  openAnswer: LocalizedString | null;
  candidate: {
    data: StrapiCandidateData;
  };
  party: {
    data: StrapiPartyData;
  };
  question: {
    data: StrapiQuestionData;
  };
  text: LocalizedString;
}>;

/**
 * The allowed `Answer` values for different `QuestionType`s based on their
 * `settings.type`.
 */
export type AnswerValues = {
  text: string | LocalizedString;
  boolean: boolean;
  number: number;
  photo: string;
  date: Date;
  singleChoiceOrdinal: Choice['key'];
  singleChoiceCategorical: Choice['key'];
  multipleChoiceCategorical: Choice['key'][];
  preferenceOrder: Choice['key'][];
};

export type StrapiPartyData = StrapiObject<{
  name: LocalizedString;
  shortName: LocalizedString;
  info: LocalizedString;
  color: string;
  colorDark: string;
  logo: {
    data?: {
      id: number | string;
      attributes: StrapiImageData;
    };
  };
  answers: {
    data: StrapiAnswerData[];
  };
  candidates: {
    data: StrapiCandidateData[];
  };
  nominations: {
    data: StrapiNominationData[];
  };
}>;

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
 * Non-exhaustive specification of the data returned by the Strapi endpoint `feedback`.
 */
export type StrapiFeedbackData = StrapiObject<{
  date?: Date;
  description?: string;
  rating?: number;
  url?: string;
  userAgent?: string;
}>;
