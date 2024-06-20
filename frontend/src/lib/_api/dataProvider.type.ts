import type {CandidateData} from '$lib/_vaa-data/candidate.type';
import type {DataObjectData} from '$lib/_vaa-data/dataObject.type';
import type {DataProviderError} from './dataProviderError';

/**
 * The DataProvider interface defines the Voter App API calls for getting data and saving feedback.
 */
export interface DataProvider<TType extends DataProviderType = 'client'> {
  /**
   * This must be called before calling any of the get methods.
   */
  init: (config: DataProviderConfig) => void;

  /**
   * Get the default `Election` object or one matching the `id`.
   * @returns A Promise with `ElectionProps`
   */
  getCandidatesData: (
    options?: GetNominatedCandidatesOptions
  ) => GetDataReturnType<TType, CandidateData>;
}

export type DataProviderConfig = {
  /**
   * The `fetch` function the `DataProvider` will use to make API calls.
   */
  fetch: typeof fetch | undefined;
};

/**
 * All the names of the getData methods available on the `DataProvider` interface.
 */
export type GetDataMethod = keyof DataProvider & `get${string}`;

/**
 * Constructs the type of the return value of the `getData` methods, which are JSON strings on the server and serializable objects on the client.
 */
type GetDataReturnType<TType extends DataProviderType, TData extends DataObjectData> = Promise<
  (TType extends 'server' ? JsonString : TData[]) | DataProviderError
>;

export type JsonString = string;

export type DataProviderType = 'client' | 'server';

/**
 * The base for all of the options passed to DataProvider methods.
 */
export interface GetDataOptionsBase extends Record<string, string | boolean | undefined> {
  /**
   * The locale for any localized content. All localized content must be converted to this locale.
   */
  locale?: string;
}

export interface GetElectionOptions extends GetDataOptionsBase, FilterById {}

export interface GetNominatedCandidatesOptions
  extends GetDataOptionsBase,
    FilterById,
    FilterByElection,
    FilterByConstituency,
    LoadAnswers {
  /**
   * Restrict the candidates to those that are members of the party with this id.
   */
  memberOfPartyId?: string;
  /**
   * Restrict the candidates to those that are nominated by the party with this id.
   */
  nominatingPartyId?: string;
}

export interface GetAllPartiesOptions
  extends GetDataOptionsBase,
    FilterById,
    LoadAnswers,
    LoadMembers {}

export interface GetNominatingPartiesOptions
  extends GetDataOptionsBase,
    FilterById,
    FilterByElection,
    FilterByConstituency,
    LoadAnswers,
    LoadMembers {
  /**
   * Whether to also load the candidates nominated by each party.
   */
  loadNominations?: boolean;
}

export interface GetQuestionsOptionsBase extends GetDataOptionsBase, FilterByElection {}

export interface GetAnyQuestionsOptions extends GetQuestionsOptionsBase {
  /**
   * The category type of the questions to load.
   */
  categoryType?: QuestionCategoryType | 'all';
}

export interface FilterById {
  /**
   * The id of a single object to load.
   */
  id?: string;
}

export interface FilterByElection {
  /**
   * The id of the election to restrict results to.
   */
  electionId?: string;
}

export interface FilterByConstituency {
  /**
   * The id of the constituency to restrict results to.
   */
  constituencyId?: string;
}

export interface LoadAnswers {
  /**
   * Whether to also load the entities' answers to questions.
   */
  loadAnswers?: boolean;
}

export interface LoadMembers {
  /**
   * Whether to also load the group's members, e.g. a party's member candidates.
   */
  loadMembers?: boolean;
}

/**
 * Feedback send to from the app's feedback components.
 */
export interface FeedbackData {
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
}
