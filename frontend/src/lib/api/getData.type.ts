/**
 * Value of enumerations for specifying the type of entity the object applies to
 */
export type EntityType = 'all' | 'candidate' | 'party';

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
      data: T[];
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
      data: StrapiConstituencyData[];
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
      startButton: string;
      electionInfo: string;
      howItWorks: string;
      help: string;
      searchMunicipality: string;
      startQuestions: string;
      selectCategories: string;
      previous: string;
      answerCategoryQuestions: string;
      readMore: string;
      skip: string;
      filter: string;
      alphaOrder: string;
      bestMatchOrder: string;
      addToList: string;
      candidateBasicInfo: string;
      candidateOpinions: string;
      home: string;
      constituency: string;
      opinions: string;
      results: string;
      yourList: string;
    };
    viewTexts: {
      id: string;
      appTitle: string;
      toolTitle: string;
      toolDescription: string;
      publishedBy: string;
      madeWith: string;
      selectMunicipalityTitle: string;
      selectMunicipalityDescription: string;
      yourConstituency: string;
      yourOpinionsTitle: string;
      yourOpinionsDescription: string;
      questionsTip: string;
      yourCandidatesTitle: string;
      yourCandidatesDescription: string;
      yourPartiesTitle: string;
      yourPartiesDescription: string;
    };
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
      data: StrapiQuestionData[];
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
      type: 'singleChoiceOrdinal';
      values: Choice[];
    }
  | {
      type: 'singleChoiceCategorical';
      values: Choice[];
    }
  | {
      type: 'multipleChoiceCategorical';
      values: Choice[];
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
export interface StrapiQuestionData {
  id: number | string;
  attributes: {
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
    order: number | null;
    category: {
      data: StrapiQuestionCategoryData;
    };
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
    order: number;
    color: string;
    colorDark: string;
    type: QuestionCategoryType;
    election: {
      data: StrapiElectionData;
    };
    questions: {
      data: StrapiQuestionData[];
    };
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
      data: StrapiNominationData[];
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
      data: StrapiAnswerData[];
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
      data: StrapiLanguageData[];
    };
    otherLanguages?: {
      data: StrapiLanguageData[];
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
  multipleChoiceCategorical: Choice['key'][];
  preferenceOrder: Choice['key'][];
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
      data?: string;
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
