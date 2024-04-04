export {};

declare global {
  /**
   * The format for localized strings.
   */
  type LocalizedString = {
    [lang: string]: string;
  };

  /**
   * Make specific properties of an interface required. Works the same way as
   * `Required<Type>` but only applies to keys listed.
   * Source: https://stackoverflow.com/questions/69327990/how-can-i-make-one-property-non-optional-in-a-typescript-type
   */
  type WithRequired<Type, Key extends keyof Type> = Type & {[Prop in Key]-?: Type[Prop]};

  /**
   * The properties of a multiple choice option in a Question.
   * TODO: This may be deprecated later by the `vaa-data` module.
   */
  interface AnswerOption {
    key: number;
    label: string;
  }

  /**
   * An entity's answers are stored in a record.
   */
  type AnswerDict = Record<string, AnswerProps>;

  /**
   * Properties of a Candidate's or Party's answer to a question.
   */
  interface AnswerProps {
    value: string | boolean | number | number[] | Date | undefined | null;
    openAnswer?: string;
  }

  /**
   * Non-exhaustive specification of the app labels.
   * TODO: Make this spec generic, because it will not be used in the frontend
   * otherwise by just providing its contents to the translation function
   */
  interface AppLabels {
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
  }

  /**
   * The application settings, combined from both local settings and those retrieved from the database.
   */
  interface AppSettings {
    colors: {
      light: {[name: string]: string};
      dark: {[name: string]: string};
    };
    font: {
      name: string;
      url: string;
    };
    supportedLocales: Array<{
      code: string;
      name: string;
      isDefault?: boolean;
    }>;
    results: {
      sections: string[];
    };
    publisher?: {
      name: string;
      logo?: ImageProps;
      logoDark?: ImageProps;
    };
  }

  /**
   * The properties of a Candidate object that can be passed onto the
   * related components.
   * TODO: This may be deprecated later by the `vaa-data` module.
   */
  interface CandidateProps {
    answers: AnswerDict;
    electionRound?: number;
    electionSymbol?: string;
    firstName: string;
    id: string;
    lastName: string;
    name: string;
    // motherTongues: string[];
    // otherLanguages: string[];
    photo?: ImageProps;
    party: PartyProps;
    // politicalExperience: string;
  }

  /**
   * Properties of an image property
   */
  interface ImageProps {
    url: string;
    thumbnail: {
      url: string;
    };
  }

  /**
   * The properties of an Election object
   */
  interface ElectionProps {
    appLabels: AppLabels;
    electionDate: Date;
    id: string;
    name: string;
    shortName: string;
    type: string;
  }

  /**
   * The properties of a Party object that can be passed onto the
   * related components.
   * TODO: This may be deprecated later by the `vaa-data` module.
   */
  interface PartyProps {
    answers: AnswerDict;
    electionRound?: number;
    electionSymbol?: string;
    id: string;
    info: string;
    name: string;
    shortName: string;
    photo?: ImageProps;
    color?: string;
    colorDark?: string;
    memberCandidateIds?: string[];
    memberCandidates?: CandidateProps[];
    nominatedCandidateIds?: string[];
    nominatedCandidates?: CandidateProps[];
  }

  /**
   * The properties of a Question object that can be passed onto the
   * related components.
   * TODO: This may be deprecated later by the `vaa-data` module.
   */
  interface QuestionProps {
    id: string;
    text: string;
    shortName: string;
    order?: number;
    category: QuestionCategoryProps;
    info?: string;
    filterable?: boolean;
    fillingInfo?: string;
    type: QuestionSettingsProps['type'];
    values?: AnswerOption[];
    min?: number | Date;
    max?: number | Date;
    notLocalizable?: boolean;
    dateType?: DateType;
  }

  /**
   * The properties of a QuestionCategory object that can be passed onto the
   * related components.
   * TODO: This may be deprecated later by the `vaa-data` module.
   */
  interface QuestionCategoryProps {
    id: string;
    name: string;
    shortName: string;
    order: number;
    type: QuestionCategoryType;
    info?: string;
    color?: string;
    colorDark?: string;
  }

  type QuestionCategoryType = 'info' | 'opinion';

  /**
   * Question type settings
   * Make sure these align with those in `lib/api/getData.types.ts` and the mock data generator
   */
  type QuestionSettingsProps =
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
        values: AnswerOption[];
      }
    | {
        type: 'singleChoiceCategorical';
        values: AnswerOption[];
      }
    | {
        type: 'multipleChoiceCategorical';
        values: AnswerOption[];
        min?: number;
        max?: number;
      }
    | {
        type: 'preferenceOrder';
        values: AnswerOption[];
        min?: number;
        max?: number;
      };

  /**
   * The preset formatting types for Dates
   * TODO: Consider allowing any `Intl.DateTimeFormatOptions` objects
   */
  type DateType = 'yearMonthDay' | 'yearMonth' | 'monthDay' | 'month' | 'weekday';

  /**
   * Value of enumerations for specifying the type of entity the object applies to
   */
  type EntityType = 'all' | 'candidate' | 'party';

  /**
   * Value of enumerations for specifying the type of entity the object applies to
   */
  type EntityType = 'all' | 'candidate' | 'party';

  /**
   * Represents any entity that can be shown in listings and has answers to questions.
   */
  type EntityProps = CandidateProps | PartyProps;

  /**
   * Conforms to `vaa-filters.WrappedEntity`
   */
  interface WrappedEntity<T extends EntityProps = EntityProps> {
    entity: T;
  }

  /**
   * Conforms to `vaa-matching.Match`
   */
  interface RankingProps<T extends EntityProps = EntityProps> extends WrappedEntity<T> {
    score: number;
    subMatches?: SubMatchProps[];
  }

  /**
   * A possibly ranked entity, accepted by all components consuming entities.
   */
  type MaybeRanked<T extends EntityProps = EntityProps> = T | WrappedEntity<T> | RankingProps<T>;

  /**
   * The submatches of a `RankingProps`
   */
  interface SubMatchProps {
    // distance: number;
    score: number;
    // TODO: Convert to QuestionCategoryProps
    questionGroup: QuestionCategoryProps;
  }
}
