import type {MatchableValue} from '$lib/vaa-matching';

export type VoterAnswer = {
  questionId: string;
  answer: MatchableValue;
};
