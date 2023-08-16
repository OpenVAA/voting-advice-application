/*
 * Abstract base class for all matchable questions
 */

import type {MatchingSpaceCoordinate, MatchableValue} from '$lib/vaa-matching';
import type {Question} from './question';
import {TemplateQuestion} from './templateQuestion';

/**
 * A utility for asserting that a generic question is a MatchableQuestion.
 * @param question The question
 * @returns True if answer is matchable.
 */
export function isMatchableQuestion(question: Question): question is MatchableQuestionBase {
  return question instanceof MatchableQuestionBase;
}

/**
 * A base class for all matchable questions. They need to inherit from this
 * so we can check for their matchability.
 */
export abstract class MatchableQuestionBase extends TemplateQuestion {
  /**
   * Used to convert a question's values into normalized distances for used
   * in matching.
   * @param value A question's native value
   * @returns The value in the signed normalized range (e.g. [-.5, .5])
   */
  abstract normalizeValue(value: MatchableValue): MatchingSpaceCoordinate;
}
