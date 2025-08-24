import { MATCH_TYPE } from '../match';
import type { HasAnswers } from '@openvaa/core';
import type { Match, MatchBase, MatchType, MatchTypeMap, SubMatch } from '../match';
import type { MatchableQuestionGroup } from '../question';

/**
 * Check if an object is a given type of match. Use this instead of `instanceof`.
 */
export function isMatchType<TType extends MatchType>(obj: unknown, type: TType): obj is MatchTypeMap[TType] {
  return isMatchBase(obj) && obj.matchType === type;
}

/**
 * Check if an object is a `Match`. The type params are used to specify the expected type params.
 */
export function isMatch<
  TTarget extends HasAnswers = HasAnswers,
  TGroup extends MatchableQuestionGroup = MatchableQuestionGroup
>(obj: unknown): obj is Match<TTarget, TGroup> {
  return isMatchType(obj, MATCH_TYPE.Match);
}

/**
 * Check if an object is a `SubMatch`. The type params are used to specify the expected type params.
 */
export function isSubMatch<TGroup extends MatchableQuestionGroup = MatchableQuestionGroup>(
  obj: unknown
): obj is SubMatch<TGroup> {
  return isMatchType(obj, MATCH_TYPE.SubMatch);
}

/**
 * Check if an object is any subtype of filter.
 */
export function isMatchBase(obj: unknown): obj is MatchBase {
  return (
    !!obj &&
    typeof obj === 'object' &&
    'matchType' in obj &&
    Object.values(MATCH_TYPE).includes(obj.matchType as MatchType)
  );
}
