import type { Match } from './match';
import type { MatchBase } from './matchBase';
import type { SubMatch } from './subMatch';

/**
 * Any concrete match type.
 */
export const MATCH_TYPE = {
  Match: 'match',
  MatchBase: 'matchBase',
  SubMatch: 'subMatch'
} as const;

/**
 * Any concrete match type.
 */
export type MatchType = (typeof MATCH_TYPE)[keyof typeof MATCH_TYPE];

/**
 * Mapping between concrete match types and their corresponding classes.
 */
export type MatchTypeMap = {
  [MATCH_TYPE.Match]: Match;
  [MATCH_TYPE.MatchBase]: MatchBase;
  [MATCH_TYPE.SubMatch]: SubMatch;
};
