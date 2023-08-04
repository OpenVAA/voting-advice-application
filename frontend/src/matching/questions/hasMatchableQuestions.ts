import {MatchableQuestion} from './matchableQuestion';

/**
 * Question groups used in SubMatches must implement this interface.
 */
export interface HasMatchableQuestions {
  matchableQuestions: MatchableQuestion[];
}
