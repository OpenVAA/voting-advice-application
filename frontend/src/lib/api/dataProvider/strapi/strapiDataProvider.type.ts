/**
 * The basic format for Strapi responses
 */
export type StrapiResponse<T> = {
  data: T;
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
      data: Array<T>;
    };
  };
};

/**
 * Non-exhaustive specification of the data returned by the Strapi endpoint `election`.
 * Currently we're only interested in the appLabels id.
 */
export interface StrapiElectionData {
  id: string;
  locale: string;
  attributes: {
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
      data: Array<StrapiConstituencyData>;
    };
  };
}

/**
 * Non-exhaustive specification of the app labels
 */
export interface StrapiAppLabelsData {
  id: string;
  attributes: {
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
  };
}

/**
 * Non-exhaustive specification of app settings
 */
export interface StrapiAppSettingsData {
  id: string;
  attributes: {
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
  };
}

/**
 * Non-exhaustive specification of the data returned by the Strapi endpoint `question-type`.
 */
export interface StrapiQuestionTypeData {
  id: number | string;
  attributes: {
    name: string;
    info: string;
    settings: QuestionTypeSettings;
    questions: {
      data: Array<StrapiQuestionData>;
    };
  };
}

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
      values: Array<Choice>;
      display?: 'vertical' | 'horizontal';
    }
  | {
      type: 'singleChoiceCategorical';
      values: Array<Choice>;
      display?: 'vertical' | 'horizontal';
    }
  | {
      type: 'multipleChoiceCategorical';
      values: Array<Choice>;
      display?: 'vertical' | 'horizontal';
      min?: number;
      max?: number;
    }
  | {
      type: 'preferenceOrder';
      values: Array<Choice>;
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
export interface StrapiQuestionData {
  id: number | string;
  attributes: {
    allowOpen: boolean | null;
    constituencies: {
      data: Array<StrapiConstituencyData>;
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
  };
}

/**
 * Non-exhaustive specification of the data returned by the Strapi endpoint `question-category`.
 */
export interface StrapiQuestionCategoryData {
  id: number | string;
  attributes: {
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
      data: Array<StrapiQuestionData>;
    };
    customData: JSONData;
  };
}

/**
 * Non-exhaustive specification of the data returned by the Strapi endpoint `nomination`.
 */
export interface StrapiNominationData {
  id: number | string;
  attributes: {
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
  };
}

/**
 * Non-exhaustive specification of the data returned by the Strapi endpoint `constitucency`.
 */
export interface StrapiConstituencyData {
  id: number | string;
  attributes: {
    name: LocalizedString;
    shortName: LocalizedString;
    info: LocalizedString;
    type: string | null;
    nominations: {
      data: Array<StrapiNominationData>;
    };
  };
}

/**
 * Non-exhaustive specification of the data returned by the Strapi endpoint `candidate`.
 */
export interface StrapiCandidateData {
  id: number | string;
  attributes: {
    answers: {
      data: Array<StrapiAnswerData>;
    };
    firstName: string;
    lastName: string;
    birthday: string;
    unaffiliated: boolean;
    manifesto: LocalizedString;
    gender?: {
      data: StrapiGenderData;
    };
    motherTongues?: {
      data: Array<StrapiLanguageData>;
    };
    otherLanguages?: {
      data: Array<StrapiLanguageData>;
    };
    party: {
      data: StrapiPartyData;
    };
    photo: {
      data?: {
        id: number | string;
        attributes: StrapiImageData;
      };
    };
  };
}

export interface StrapiAnswerData {
  id: number | string;
  attributes: {
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
  };
}

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
  multipleChoiceCategorical: Array<Choice['key']>;
  preferenceOrder: Array<Choice['key']>;
};

/** TODO: Remove when generic questions are online */
export interface StrapiLanguageData {
  id: number;
  attributes: {
    localisationCode: string;
    name: string;
  };
}

export interface StrapiGenderData {
  id: number;
  attributes: {
    name: string;
  };
}

export interface StrapiPartyData {
  id: number | string;
  attributes: {
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
      data: Array<StrapiAnswerData>;
    };
    candidates: {
      data: Array<StrapiCandidateData>;
    };
    nominations: {
      data: Array<StrapiNominationData>;
    };
  };
}

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
export interface StrapiFeedbackData {
  id: number | string;
  attributes: {
    date?: Date;
    description?: string;
    rating?: number;
    url?: string;
    userAgent?: string;
  };
}
