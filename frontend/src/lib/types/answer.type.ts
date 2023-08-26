import type {MatchableQuestion, MatchableValue} from '$lib/vaa-matching';

/**
 * This needs to be implement `MatchableAnswer` from `vaa-matching`.
 */
export type Answer = {
  question: MatchableQuestion;
  answer: MatchableValue;
};
