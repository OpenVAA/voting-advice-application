export const DATA_ROOT = '/data';

// NB. We can't use an Enum here because the values are computed and not numbers
/**
 * The paths to the local data folders. Remember to join these with `process.cwd()` when using them.
 */
export const DataFolder = {
  Feedback: `${DATA_ROOT}/feedback`,
  Root: DATA_ROOT
} as const;
