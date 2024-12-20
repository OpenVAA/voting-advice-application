import type { DynamicSettings, StaticSettings } from '@openvaa/app-shared';
import type { TranslationKey } from './generated/translationKey';

export {};

declare global {
  /**
   * The format for localized strings.
   */
  type LocalizedString = {
    [lang: string]: string;
  };

  /*
   * The format for JSON structure.
   */
  type JSONData = null | string | number | boolean | { [x: string]: JSONData } | Array<JSONData>;

  /**
   * Make specific properties of an interface required. Works the same way as
   * `Required<Type>` but only applies to keys listed.
   * Source: https://stackoverflow.com/questions/69327990/how-can-i-make-one-property-non-optional-in-a-typescript-type
   */
  type WithRequired<TType, TKey extends keyof TType> = TType & { [Prop in TKey]-?: TType[Prop] };

  /**
   * The properties of a multiple choice option in a Question.
   * TODO: This may be deprecated later by the `@openvaa/data` module.
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
   * The possible values for an answer to a question.
   */
  type AnswerPropsValue =
    | string
    | Array<string>
    | boolean
    | number
    | Array<number>
    | Date
    | LocalizedString
    | undefined
    | null;

  /**
   * Properties of a Candidate's or Party's answer to a question.
   */
  interface AnswerProps<TValue extends AnswerPropsValue = AnswerPropsValue> {
    value: TValue;
    openAnswer?: string;
  }

  /**
   * The application settings, combined from both local settings and those retrieved from the database.
   */
  type AppSettings = StaticSettings & DynamicSettings;

  /**
   * A reference to a question in `AppSettings`.
   */
  type AppSettingsQuestionRef = Exclude<AppSettings['results']['cardContents']['candidate'][number], 'submatches'>;

  /**
   * A entity details' content type in `AppSettings`.
   */
  type AppSettingsEntityDetailsContent = AppSettings['entityDetails']['contents']['party'][number];

  /**
   * The method for performing group, i.e. party, maching in `AppSettings`.
   */
  type AppSettingsGroupMatchingType = AppSettings['matching']['partyMatching'];

  /**
   * The application customization provided by `DataProvider`.
   */
  type AppCustomization = {
    publisherName?: string;
    publisherLogo?: ImageProps;
    publisherLogoDark?: ImageProps;
    poster?: ImageProps;
    posterDark?: ImageProps;
    candPoster?: ImageProps;
    candPosterDark?: ImageProps;
    translationOverrides?: { [translationKey: TranslationKey]: string };
    candidateAppFAQ?: Array<{ question: string; answer: string }>;
  };

  /**
   * The persistent preferences that can be set by the user.
   */
  interface UserPreferences {
    dataCollection?: {
      consent: UserDataConsent;
      date: string;
    };
    feedback: {
      status: UserFeedbackStatus;
      date: string;
    };
    survey: {
      status: UserFeedbackStatus;
      date: string;
    };
  }

  /**
   * The possible values for a user's data collection consent
   */
  type UserDataCollectionConsent = 'denied' | 'granted' | 'indetermined';

  /**
   * The possible values for the status of asking for a user's feedback or filling out a survey.
   */
  type UserFeedbackStatus = 'received' | 'indetermined';

  /**
   * The properties of a Candidate object that can be passed onto the
   * related components.
   * TODO: This may be deprecated later by the `@openvaa/data` module.
   */
  interface CandidateProps {
    answers: AnswerDict;
    electionRound?: number;
    electionSymbol?: string;
    firstName: string;
    id: string;
    lastName: string;
    name: string;
    photo?: ImageProps;
    party?: PartyProps;
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
    electionDate: Date;
    id: string;
    name: string;
    shortName: string;
    type: string;
  }

  /**
   * The properties of a Party object that can be passed onto the
   * related components.
   * TODO: This may be deprecated later by the `@openvaa/data` module.
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
    memberCandidateIds?: Array<string>;
    memberCandidates?: Array<CandidateProps>;
    nominatedCandidateIds?: Array<string>;
    nominatedCandidates?: Array<CandidateProps>;
  }

  /**
   * The properties of a Question object that can be passed onto the
   * related components.
   * TODO: This may be deprecated later by the `@openvaa/data` module.
   */
  interface QuestionProps {
    id: string;
    text: string;
    shortName: string;
    order?: number;
    required?: boolean;
    category: QuestionCategoryProps;
    entityType: EntityType;
    info?: string;
    filterable?: boolean;
    fillingInfo?: string;
    hidden?: boolean;
    type: QuestionSettingsProps['type'];
    textType?: 'short' | 'long';
    values?: Array<AnswerOption>;
    min?: number | Date;
    max?: number | Date;
    notLocalizable?: boolean;
    dateType?: DateType;
    customData?:
      | (JSONData & {
          video?: CustomVideoProps;
          vertical?: boolean;
        })
      | null;
  }

  /**
   * The properties for defining video content in customData
   */
  interface CustomVideoProps {
    title: string;
    sources: Array<string>;
    captions: string;
    poster: string;
    aspectRatio: number;
    transcript?: string;
  }

  /**
   * The properties of a QuestionCategory object that can be passed onto the
   * related components.
   * TODO: This may be deprecated later by the `@openvaa/data` module.
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
    questions: Array<QuestionProps>;
    customData?:
      | (JSONData & {
          emoji?: string;
        })
      | null;
  }

  type QuestionCategoryType = 'info' | 'opinion';

  /**
   * Question type settings
   * Make sure these align with the types defined for the `DataProvider` implementations in `lib/api/dataProvider/` and the mock data generator
   */
  type QuestionSettingsProps =
    | {
        type: 'text';
        textType?: 'short' | 'long';
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
        type: 'linkList';
      }
    | {
        type: 'singleChoiceOrdinal';
        values: Array<AnswerOption>;
        display?: 'vertical' | 'horizontal';
      }
    | {
        type: 'singleChoiceCategorical';
        values: Array<AnswerOption>;
        display?: 'vertical' | 'horizontal';
      }
    | {
        type: 'multipleChoiceCategorical';
        values: Array<AnswerOption>;
        display?: 'vertical' | 'horizontal';
        min?: number;
        max?: number;
      }
    | {
        type: 'preferenceOrder';
        values: Array<AnswerOption>;
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
   * Represents any entity that can be shown in listings and has answers to questions.
   */
  type EntityProps = CandidateProps | PartyProps;

  /**
   * Conforms to `@openvaa/filters.WrappedEntity`
   */
  interface WrappedEntity<TEntity extends EntityProps = EntityProps> {
    entity: TEntity;
  }

  /**
   * Conforms to `@openvaa/matching.Match`
   */
  interface RankingProps<TEntity extends EntityProps = EntityProps> extends WrappedEntity<TEntity> {
    score: number;
    subMatches?: Array<SubMatchProps>;
  }

  /**
   * A possibly ranked entity, accepted by all components consuming entities.
   */
  type MaybeRanked<TEntity extends EntityProps = EntityProps> =
    | TEntity
    | WrappedEntity<TEntity>
    | RankingProps<TEntity>;

  /**
   * The submatches of a `RankingProps`
   */
  interface SubMatchProps {
    // distance: number;
    score: number;
    // TODO: Convert to QuestionCategoryProps
    questionGroup: QuestionCategoryProps;
  }

  /**
   * These are all the DaisyUI colors supported by the application.
   * These can be used in utility classes like ``fill-${color}``,
   * but be sure to check `tailwind.config.cjs` for the classes
   * that are safelisted for use.
   */
  type Color =
    | 'current'
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'neutral'
    | 'base-100'
    | 'base-200'
    | 'base-300'
    | 'info'
    | 'success'
    | 'warning'
    | 'error'
    | 'base-content'
    | 'primary-content'
    | 'secondary-content'
    | 'accent-content'
    | 'info-content'
    | 'success-content'
    | 'warning-content'
    | 'error-content'
    | 'white';
}
