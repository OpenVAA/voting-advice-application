import type {DATA_COLLECTIONS} from '$lib/_api/dataCollections';

export const DATA_ROOT = '/data';

/**
 * The paths to the local data folders. Remember to join these with `process.cwd()` when using them.
 */
export const DATA_PATHS: Record<keyof typeof DATA_COLLECTIONS, string> = {
  candidates: `${DATA_ROOT}/candidates.json`,
  constituencies: `${DATA_ROOT}/constituencies.json`,
  elections: `${DATA_ROOT}/elections.json`,
  nominations: `${DATA_ROOT}/nominations.json`
} as const;

export type DataPath = (typeof DATA_PATHS)[keyof typeof DATA_PATHS];
