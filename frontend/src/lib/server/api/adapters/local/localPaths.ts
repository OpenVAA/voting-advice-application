import { DP_METHOD } from '$lib/api/base/dataTypes';
import type { DynamicSettings } from '@openvaa/app-shared';
import type {
  AnyEntityVariantData,
  AnyNominationVariantPublicData,
  AnyQuestionVariantData,
  ConstituencyData,
  ConstituencyGroupData,
  ElectionData,
  LocalizedObject,
  QuestionCategoryData
} from '@openvaa/data';
import type { AppCustomization } from '$lib/contexts/app';

export const READ_PATHS = Object.fromEntries(
  Object.keys(DP_METHOD).map((collection) => [collection, `/data/${collection}.json`])
) as Record<keyof typeof DP_METHOD, string>;

export type ReadPath = keyof typeof READ_PATHS;

export const CREATE_PATHS = {
  feedbacks: '/data/feedbacks'
};

export type CreatePath = keyof typeof CREATE_PATHS;

export const LOCAL_PATH = { ...READ_PATHS, ...CREATE_PATHS };

export type LocalPath = keyof typeof LOCAL_PATH;

/**
 * The locally stored data is structured slightly different from `DPDataType`, because `Nomination`s and `Entity`s are stored in separate files and because the data may be localized.
 */
export type LocalDataType = {
  appSettings: Partial<DynamicSettings>;
  appCustomization: LocalizedObject<AppCustomization>;
  elections: Array<LocalizedObject<ElectionData>>;
  constituencies: {
    groups: Array<LocalizedObject<ConstituencyGroupData>>;
    constituencies: Array<LocalizedObject<ConstituencyData>>;
  };
  nominations: Array<LocalizedObject<AnyNominationVariantPublicData>>;
  entities: Array<LocalizedObject<AnyEntityVariantData>>;
  questions: {
    categories: Array<LocalizedObject<QuestionCategoryData>>;
    questions: Array<LocalizedObject<AnyQuestionVariantData>>;
  };
};
