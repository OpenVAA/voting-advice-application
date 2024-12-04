import { DP_METHOD, type DPDataType } from '$lib/api/base/dataTypes';
import type { AnyNominationVariantPublicData } from '@openvaa/data';

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
 * The locally stored data is structured slightly different from `DPDataType`, because `Nomination`s and `Entity`s are stored in separate files.
 */
export type LocalDataType = {
  [KCollection in keyof DPDataType]: KCollection extends 'nominations'
    ? Array<AnyNominationVariantPublicData>
    : DPDataType[KCollection];
};
