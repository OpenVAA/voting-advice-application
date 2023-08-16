/**
 * This is the format for the appLabels.
 */

/**
 * AppLabels are grouped into collections of strings. For typing to work,
 * we have to enforce a specific hierarchical structure.
 */
export type AppLabels = {
  [group: string]: {
    [key: string]: string;
  };
};
