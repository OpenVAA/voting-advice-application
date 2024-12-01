/**
 * The DataProvider interface defines the Voter App API calls for getting data and saving feedback.
 */
export interface DataProvider {
  /**
   * Get the application settings, which are combined with local settings to get the effective settings.
   * @returns A Promise with `AppSettings` or `undefined` if the data source is not available.
   * @throws Never: `getAppSettings` can be used to test the database connection, because it should not throw if a connection could not be made but instead resolve to `undefined`.
   */
  getAppSettings: (options?: GetDataOptionsBase) => Promise<Partial<AppSettings> | undefined>;

  getAppCustomization: (options?: GetDataOptionsBase) => Promise<AppCustomization>;

  /**
   * Get the default `Election` object or one matching the `id`.
   * @returns A Promise with `LegacyElectionProps`
   */
  getElection: (options?: GetElectionOptions) => Promise<LegacyElectionProps>;

  /**
   * This is a redundant and will likely be made obsolute. Use the other question getters instead.
   */
  getQuestions: (options?: GetAnyQuestionsOptions) => Promise<Array<LegacyQuestionProps>>;

  /**
   * Get all the info questions.
   * @returns A Promise with an array of `LegacyQuestionProps`
   */
  getInfoQuestions: (options?: GetQuestionsOptionsBase) => Promise<Array<LegacyQuestionProps>>;

  /**
   * Get all the opinion questions.
   * @returns A Promise with an array of `LegacyQuestionProps`
   */
  getOpinionQuestions: (options?: GetQuestionsOptionsBase) => Promise<Array<LegacyQuestionProps>>;

  /**
   * Get all the parties, regardless whether they are nominated, have nominations or not.
   * @returns A Promise with an array of `LegacyPartyProps`
   */
  getAllParties: (options?: GetAllPartiesOptions) => Promise<Array<LegacyPartyProps>>;

  /**
   * Get all the nominated parties or parties nominating candidates.
   * @returns A Promise with an array of `LegacyPartyProps`
   */
  getNominatingParties: (options?: GetNominatingPartiesOptions) => Promise<Array<LegacyPartyProps>>;

  /**
   * Get all the nominated candidates.
   * @returns A Promise with an array of `LegacyCandidateProps`
   */
  getNominatedCandidates: (options?: GetNominatedCandidatesOptions) => Promise<Array<LegacyCandidateProps>>;

  /**
   * Optional method for receiving feedback. If this is not provided, the built-in feedback implementation will be used, which saves feedback as json files on the disk.
   * NB. Must be accessible from the client side.
   */
  setFeedback?: (data: FeedbackData) => Promise<Response | undefined>;
}

/**
 * The base for all of the options passed to DataProvider methods.
 */
export interface GetDataOptionsBase {
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

export interface GetAllPartiesOptions extends GetDataOptionsBase, FilterById, LoadAnswers, LoadMembers {}

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
  categoryType?: LegacyQuestionCategoryType | 'all';
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
