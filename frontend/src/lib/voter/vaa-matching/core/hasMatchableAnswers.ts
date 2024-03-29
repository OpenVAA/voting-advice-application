import type {MatchableQuestion} from '../questions/matchableQuestion';
import type {MatchableValue} from './matchableValue';

/**
 * Entities to be matched must implement this interface.
 * The wording getMatchableAnswer is quite verbose, but it's used instead
 * of getAnswer to allow that to be used in a more general sense.
 */
export interface HasMatchableAnswers {
  getMatchableAnswerValue: (question: MatchableQuestion) => MatchableValue;
  matchableAnswers: MatchableAnswer[];
}

/**
 * Question-value pairs used for matching.
 */
export interface MatchableAnswer {
  question: MatchableQuestion;
  value: MatchableValue;
}
