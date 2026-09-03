import type {
  FilterByConstituency,
  FilterByElection,
  FilterByElectionRound,
  FilterByEntityType,
  FilterById
} from './getDataFilters.type';

/**
 * The base for all of the options passed to DataProvider methods.
 */
export interface GetDataOptionsBase {
  /**
   * The locale for any localized content. All localized content must be converted to this locale.
   */
  locale?: string;
}

/**
 * The options for the `getAppCustomization` method only include the `locale`.
 */
export type GetAppCustomizationOptions = GetDataOptionsBase;

/**
 * The options for the `getElectionData` method.
 */
export type GetElectionsOptions = GetDataOptionsBase & FilterById;

/**
 * The options for the `getConstituencyData` method. NB. The possible `id` filter is applied to the `Constituency Groups` and all their member `Constituencies` are returned.
 */
export type GetConstituenciesOptions = GetDataOptionsBase & FilterById;

/**
 * The options for the `getNominationData` method.
 */
export type GetNominationsOptions = GetDataOptionsBase &
  FilterByElection &
  FilterByConstituency &
  FilterByElectionRound & {
    /**
     * If `true`, include unconfirmed or draft nominations will also be included. They're excluded by default.
     * This may be useful for preview purposes, but this option should not be used in voter-facing instances.
     */
    includeUnconfirmed?: boolean;
  };

/**
 * The options for the `getEntityData` method. NB. If the `id` filter is defined, the `entityType` filter must also be defined.
 */
export type GetEntitiesOptions = GetDataOptionsBase & FilterById & FilterByEntityType;

/**
 * The options for the `getQuestionData` method. NB. All three filters are applied in SQL by the `get_questions` RPC, independently to the `QuestionCategory`s and to the `Question`s, so a question scoped more narrowly than its category is excluded on its own terms. On every axis a row whose filter column is `null` or an empty array applies to all, so it is always returned.
 */
export type GetQuestionsOptions = GetDataOptionsBase & FilterByElection & FilterByConstituency & FilterByElectionRound;
