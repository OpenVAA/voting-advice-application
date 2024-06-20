export const DATA_ROOT = '/data';

/**
 * The paths to the local data folders. Remember to join these with `process.cwd()` when using them.
 */
export const DATA_PATHS = {
  candidates: `${DATA_ROOT}/candidates.json`
} as const;

export type DataPath = (typeof DATA_PATHS)[keyof typeof DATA_PATHS];
