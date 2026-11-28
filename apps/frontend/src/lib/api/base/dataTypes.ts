import type { DynamicSettings } from '@openvaa/app-shared';
import type {
  AnyEntityVariantData,
  AnyNominationVariantPublicData,
  AnyQuestionVariantData,
  ConstituencyData,
  ConstituencyGroupData,
  ElectionData,
  QuestionCategoryData
} from '@openvaa/data';
import type { AppCustomization } from '$lib/contexts/app';
import type { DataProvider } from './dataProvider.type';

/**
 * The `DataProvider` methods for the data collections.
 */
export const DP_METHOD: Record<keyof DPDataType, keyof DataProvider> = {
  appSettings: 'getAppSettings',
  appCustomization: 'getAppCustomization',
  elections: 'getElectionData',
  constituencies: 'getConstituencyData',
  nominations: 'getNominationData',
  entities: 'getEntityData',
  questions: 'getQuestionData'
} as const;

/**
 * The members of the application settings that are not stored settings but facts about the project the provider derives for its caller.
 */
export type DerivedAppSettings = {
  /**
   * Whether the Voter App is shown to this caller. It follows the project's `open_for_voters`, the one switch that publishes a project to voters: `false` only when the project is closed and the caller holds no grant in it, so a grant holder previews a closed project's Voter App. Absent means `true`: a provider without projects, such as the local one, leaves it out.
   */
  voterAppAccessible?: boolean;
};

/**
 * The data types of the collections that `DataProvider` provides.
 */
export type DPDataType = {
  appSettings: Partial<DynamicSettings> & DerivedAppSettings;
  appCustomization: AppCustomization;
  elections: Array<ElectionData>;
  constituencies: {
    groups: Array<ConstituencyGroupData>;
    constituencies: Array<ConstituencyData>;
  };
  nominations: {
    nominations: Array<AnyNominationVariantPublicData>;
    entities: Array<AnyEntityVariantData>;
  };
  entities: Array<AnyEntityVariantData>;
  questions: {
    categories: Array<QuestionCategoryData>;
    questions: Array<AnyQuestionVariantData>;
  };
};

/**
 * Assert that the given string is a valid data collection name.
 */
export function isDPDataType(collection?: string): collection is keyof DPDataType {
  return collection != null && collection in DP_METHOD;
}
