import type {Id} from '$lib/_vaa-data';
import type {DataCollectionTypes} from './dataCollections';
import type {DataProviderError} from './dataProviderError';

/**
 * The DataProvider type defines the Voter App API calls for getting data and saving feedback.
 */
export interface DataProvider<TType extends DataProviderType = 'client'> {
  /**
   * This must be called before calling any of the get methods.
   */
  init: (config: DataProviderConfig) => void;

  getElectionsData: (
    options?: GetDataOptions['elections']
  ) => GetDataReturnType<'elections', TType>;
  getConstituenciesData: (
    options?: GetDataOptions['constituencies']
  ) => GetDataReturnType<'constituencies', TType>;
  getNominationsData: (
    options?: GetDataOptions['nominations']
  ) => GetDataReturnType<'nominations', TType>;
  getCandidatesData: (
    options?: GetDataOptions['candidates']
  ) => GetDataReturnType<'candidates', TType>;
}

export type DataProviderConfig = {
  /**
   * The `fetch` function the `DataProvider` will use to make API calls.
   */
  fetch: typeof fetch | undefined;
};

/**
 * Constructs the type of the return value of the `getData` methods, which are JSON strings on the server and serializable objects on the client.
 */
export type GetDataReturnType<
  TCollection extends keyof DataCollectionTypes,
  TType extends DataProviderType = 'client'
> = Promise<(TType extends 'server' ? JsonString : DataContent<TCollection>) | DataProviderError>;

export type DataContent<TCollection extends keyof DataCollectionTypes> =
  TCollection extends 'nominations'
    ? NominationsAndEntities
    : Array<DataCollectionTypes[TCollection]>;

export type NominationsAndEntities = {
  nominations: Array<DataCollectionTypes['nominations']>;
  candidates?: Array<DataCollectionTypes['candidates']>;
  // parties?: Array<DataCollectionTypes['parties']>;
};

/**
 * All the names of the getData methods available on the `DataProvider` type.
 */
export type GetDataMethod = keyof DataProvider & `get${string}`;

export type JsonString = string;

export type DataProviderType = 'client' | 'server';

export type GetDataOptions = {
  candidates: GetEntitiesOptions;
  constituencies: GetConstituenciesOptions;
  elections: GetElectionsOptions;
  nominations: GetNominationsOptions;
};

/**
 * The base for all of the options passed to DataProvider methods.
 */
export type GetDataOptionsBase = Record<string, string | boolean | undefined> & {
  /**
   * The locale for any localized content. All localized content must be converted to this locale.
   */
  locale?: string;
};

export type GetElectionsOptions = GetDataOptionsBase & FilterById;

export type GetConstituenciesOptions = GetDataOptionsBase & FilterById;

export type GetNominationsOptions = GetDataOptionsBase &
  FilterByElection &
  FilterByConstituency &
  LoadEntities &
  LoadAnswers;

export type GetEntitiesOptions = GetDataOptionsBase & FilterById & LoadAnswers;

// export type GetAllPartiesOptions
//   = GetDataOptionsBase,
//     FilterById,
//     LoadAnswers,
//     LoadMembers {}

// export type GetNominatingPartiesOptions
//   = GetDataOptionsBase,
//     FilterById,
//     FilterByElection,
//     FilterByConstituency,
//     LoadAnswers,
//     LoadMembers {
//   /**
//    * Whether to also load the candidates nominated by each party.
//    */
//   loadNominations?: boolean;
// }

// export type GetQuestionsOptionsBase = GetDataOptionsBase, FilterByElection {}

// export type GetAnyQuestionsOptions = GetQuestionsOptionsBase {
//   /**
//    * The category type of the questions to load.
//    */
//   categoryType?: QuestionCategoryType | 'all';
// }

export type FilterById = {
  /**
   * The id of a single object to load.
   */
  id?: Id;
};

export type FilterByElection = {
  /**
   * The id of the election to restrict results to.
   */
  electionId?: Id;
};

export type FilterByConstituency = {
  /**
   * The id of the constituency to restrict results to.
   */
  constituencyId?: Id;
};

export type LoadEntities =
  | {
      /**
       * Whether to also load all referenced entities when getting nomination data.
       */
      loadAllEntities: boolean;
    }
  | {
      /**
       * Whether to also load all referenced candidates when getting nomination data.
       */
      loadCandidates?: boolean;
      /**
       * Whether to also load all referenced parties when getting nomination data.
       */
      // loadParties?: boolean;
    };

export type LoadAnswers = {
  /**
   * Whether to also load the entities' answers to questions.
   */
  loadAnswers?: boolean;
};

export type LoadMembers = {
  /**
   * Whether to also load the group's members, e.g. a party's member candidates.
   */
  loadMembers?: boolean;
};

/**
 * Feedback send to from the app's feedback components.
 */
export type FeedbackData = {
  /**
   * Between 1 and 5.
   */
  rating?: number;
  /**
   * An optional message sent by the user.
   */
  description?: string;
  /**
   * Auto-filled date.
   */
  date: Date;
  /**
   * Auto-filled url of the page the feedback was sent from.
   */
  url?: string;
  /**
   * Auto-filled `userAgent` string.
   */
  userAgent?: string;
};
