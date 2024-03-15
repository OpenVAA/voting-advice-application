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
   * Properties of a Candidate's or Party's answer to a question.
   */
  interface AnswerProps {
    questionId: string;
    answer?: string | boolean | number | number[] | Date | null;
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
   * The properties of a Candidate object that can be passed onto the
   * related components.
   * TODO: This may be deprecated later by the `vaa-data` module.
   */
  interface CandidateProps {
    answers?: AnswerProps[];
    electionRound?: number;
    electionSymbol?: string;
    firstName: string;
    id: string;
    lastName: string;
    photoURL?: string;
    party: PartyProps;
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
    answers?: AnswerProps[];
    electionRound?: number;
    electionSymbol?: string;
    id: string;
    info: string;
    name: string;
    shortName: string;
    photo: string;
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
    order: number;
    category: QuestionCategoryProps;
    info?: string;
    fillingInfo?: string;
    type: QuestionSettingsProps['type'];
    values?: ChoiceProps[];
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
        values: ChoiceProps[];
      }
    | {
        type: 'singleChoiceCategorical';
        values: ChoiceProps[];
      }
    | {
        type: 'multipleChoiceCategorical';
        values: ChoiceProps[];
        min?: number;
        max?: number;
      }
    | {
        type: 'preferenceOrder';
        values: ChoiceProps[];
        min?: number;
        max?: number;
      };

  /**
   * The preset formatting types for Dates
   * TODO: Consider allowing any `Intl.DateTimeFormatOptions` objects
   */
  type DateType = 'yearMonthDay' | 'yearMonth' | 'monthDay' | 'month' | 'weekday';

  /**
   * The format for an option in a multiple choice question.
   */
  interface ChoiceProps {
    key: number;
    label: string;
  }

  /**
   * Represents any entity that can be shown in listings and has answers to questions.
   */
  type EntityProps = CandidateProps | PartyProps;

  /**
   * These conform to `vaa-matching.Match`
   */
  interface RankingProps<T extends EntityProps> {
    // distance: number;
    entity: T;
    score: number;
    subMatches?: SubMatchProps[];
  }

  /**
   * The submatches of a `RankingProps`
   */
  interface SubMatchProps {
    // distance: number;
    score: number;
    // TODO: Convert to QuestionCategoryProps
    questionGroup: {
      label?: string; // Convert to name
      color?: string;
      colorDark?: string;
    };
  }

  export type CandidateDetailsCardProps = {
    /**
     *  Defines whether component is used to show candidate's preview or if it is
     * used in the voter side to render both candidate's and voters answers.
     * */

    candidateView?: boolean;
  };
}
