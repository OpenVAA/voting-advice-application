import type { AdapterType } from './adapterType.type';
import type { DPDataType } from './dataTypes';
import type {
  GetAppCustomizationOptions,
  GetConstituenciesOptions,
  GetDataOptionsBase,
  GetElectionsOptions,
  GetEntitiesOptions,
  GetNominationsOptions,
  GetQuestionsOptions
} from './getDataOptions.type';

/**
 * The `DataProvider` interface defines the core app API calls for getting settings and data.
 */
export interface DataProvider<TType extends AdapterType = 'universal'> {
  /**
   * Get the application settings, which are combined with local settings to get the effective settings.
   * @returns A `Promise` resolving to `DynamicSettings`.
   * @throws Error on failure.
   */
  getAppSettings: (options?: GetDataOptionsBase) => DPReturnType<'appSettings', TType>;

  /**
   * Get application customization options, including overriden translations.
   * @returns A Promise with `AppSettings` or `undefined` if the data source is not available.
   * @returns A `Promise` resolving to `AppCustomization`.
   * @throws Error on failure.
   */
  getAppCustomization: (options?: GetAppCustomizationOptions) => DPReturnType<'appCustomization', TType>;

  /**
   * Get `ElectionData` for providing to the `DataRoot`.
   * @param options - Possible options for filtering the data.
   * @returns A `Promise` resolving to the data.
   * @throws Error on failure.
   */
  getElectionData: (options?: GetElectionsOptions) => DPReturnType<'elections', TType>;

  /**
   * Get `ConstituencyGroupData` and `ConstituencyData` for providing to the `DataRoot`.
   * @param options - Possible options for filtering the data. The possible `id` filter is only applied to the `Constituency Groups`. NB. `Constituency`s are not necessarily filtered because, we cannot easily check if they belong to a group due to possible `parent` relationships.
   * @returns A `Promise` resolving to the data.
   * @throws Error on failure.
   */
  getConstituencyData: (options?: GetConstituenciesOptions) => DPReturnType<'constituencies', TType>;

  /**
   * Get `AnyNominationVariantPublicData` and linked `AnyEntityVariantData` for providing to the `DataRoot`.
   * @param options - Possible options for filtering the data.
   * @returns A `Promise` resolving to the data.
   * @throws Error on failure.
   */
  getNominationData: (options?: GetNominationsOptions) => DPReturnType<'nominations', TType>;

  /**
   * Get `AnyEntityVariantData` for providing to the `DataRoot`.
   * @param options - Possible options for filtering the data. NB. If the `id` filter is defined, the `entityType` filter must also be defined.
   * @returns A `Promise` resolving to the data.
   * @throws Error on failure.
   */
  getEntityData: (options?: GetEntitiesOptions) => DPReturnType<'entities', TType>;

  /**
   * Get `QuestionCategoryData` and `AnyQuestionVariantData` for providing to the `DataRoot`.
   * @param options - Possible options for filtering the data.
   * @returns A `Promise` resolving to the data.
   * @throws Error on failure.
   */
  getQuestionData: (options?: GetQuestionsOptions) => DPReturnType<'questions', TType>;
}

/**
 * Constructs the type of the return value of the data getter methods, which are `Response` of JSON strings on the server and serializable objects on the client.
 */
export type DPReturnType<TCollection extends keyof DPDataType, TType extends AdapterType = 'universal'> = Promise<
  TType extends 'server' ? Response : DPDataType[TCollection]
>;
