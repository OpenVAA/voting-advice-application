import type { DynamicSettings } from '@openvaa/app-shared';
import type {
  AnyEntityVariantData,
  AnyNominationVariantPublicData,
  AnyQuestionVariantData,
  ConstituencyData,
  ConstituencyGroupData,
  ElectionData
} from '@openvaa/data';
import type { QuestionCategoryData } from '@openvaa/data';
import type { AppCustomization } from '$lib/contexts/app';
import type { FactorLoadingData } from '$lib/contexts/voter/factorLoadings/factorLoading.type';
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
  questions: 'getQuestionData',
  factorLoadings: 'getFactorLoadingData'
} as const;

/**
 * The data types of the collections that `DataProvider` provides.
 */
export type DPDataType = {
  appSettings: Partial<DynamicSettings>;
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
  factorLoadings: Array<FactorLoadingData>;
};

/**
 * Assert that the given string is a valid data collection name.
 */
export function isDPDataType(collection?: string): collection is keyof DPDataType {
  return collection != null && collection in DP_METHOD;
}
