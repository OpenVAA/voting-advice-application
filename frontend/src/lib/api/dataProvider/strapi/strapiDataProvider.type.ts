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
 * Non-exhaustive specification of the data returned by the Strapi endpoint `election`.
 */
export interface StrapiElectionData {
  id: string;
  locale: string;
  attributes: {
    electionDate: Date;
    answersLocked: boolean;
    electionStartDate: Date;
    name: LocalizedString;
    shortName: LocalizedString;
    organizer: LocalizedString;
    info: LocalizedString;
    electionType: string | null;
    constituencies: {
      data: StrapiConstituencyData[];
    };
  };
}

/**
 * Non-exhaustive specification of app settings
 */
export interface StrapiAppSettingsData {
  id: string;
  attributes: {
    underMaintenance?: boolean;
    survey?: {
      linkTemplate: string;
      showIn: Array<'frontpage' | 'entityDetails' | 'navigation' | 'resultsPopup'>;
    };
    entityDetails?: {
      contents: {
        candidate: Array<'info' | 'opinions'>;
        party: Array<'candidates' | 'info' | 'opinions'>;
      };
      showMissingElectionSymbol: {
        candidate: boolean;
        party: boolean;
      };
      showMissingAnswers: {
        candidate: boolean;
        party: boolean;
      };
    };
    header?: {
      showFeedback: boolean;
      showHelp: boolean;
    };
    headerStyle?: {
      dark: {
        bgColor?: string;
        overImgBgColor?: string;
      };
      light: {
        bgColor?: string;
        overImgBgColor?: string;
      };
      imgSize?: string;
      imgPosition?: string;
    };
    matching?: {
      minimumAnswers: number;
      partyMatching: 'none' | 'answersOnly' | 'mean' | 'median';
    };
    questions?: {
      categoryIntros?: {
        allowSkip?: boolean;
        show: boolean;
      };
      questionsIntro: {
        allowCategorySelection?: boolean;
        show: boolean;
      };
      showCategoryTags: boolean;
      showResultsLink?: boolean;
    };
    results: {
      cardContents: {
        candidate: Array<
          'submatches' | {question: string; hideLabel?: boolean; format?: 'default' | 'tag'}
        >;
        party: Array<
          | 'submatches'
          | 'candidates'
          | {question: string; hideLabel?: boolean; format?: 'default' | 'tag'}
        >;
      };
      sections: Array<'candidate' | 'party'>;
      showFeedbackPopup?: number;
      showSurveyPopup?: number;
    };
  };
}

/**
 * Non-exhaustive specification of app customization
 */
export interface StrapiAppCustomizationData {
  id: number | string;
  attributes: {
    translationOverrides: {[locale: string]: {[translationKey: string]: string}};
    candidateAppFAQ: {[locale: string]: Array<{question: string; answer: string}>};
    publisherName: LocalizedString | null;
    publisherLogo: StrapiImage;
    publisherLogoDark: StrapiImage;
    poster: StrapiImage;
    posterDark: StrapiImage;
    candPoster: StrapiImage;
    candPosterDark: StrapiImage;
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
    settings: QuestionSettingsProps;
    questions: {
      data: StrapiQuestionData[];
    };
  };
}

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
    filterable: boolean | null;
    order: number | null;
    required: boolean | null;
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
      data: StrapiQuestionData[];
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
    party: {
      data: StrapiPartyData;
    };
    photo: StrapiImage;
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
  singleChoiceOrdinal: AnswerOption['key'];
  singleChoiceCategorical: AnswerOption['key'];
  multipleChoiceCategorical: AnswerOption['key'][];
  preferenceOrder: AnswerOption['key'][];
};

/** TODO: Remove when generic questions are online */
export interface StrapiLanguageData {
  id: number;
  attributes: {
    localisationCode: string;
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
    logo: StrapiImage;
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

export type StrapiImage = {
  data?: {
    id: number | string;
    attributes: StrapiImageData;
  };
};

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
