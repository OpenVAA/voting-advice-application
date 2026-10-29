import type { AnswerDict, HasAnswers } from '@openvaa/core';
import type { AnyNominationVariant } from '@openvaa/data';

/**
 * A wrapper of targets to match for whom answers are replaced with imputed ones.
 */
export class MatchingProxy<TNomination extends AnyNominationVariant = AnyNominationVariant> implements HasAnswers {
  constructor(
    public target: TNomination,
    public answers: AnswerDict
  ) {}
}
