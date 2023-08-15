/*
 * Class for simple questions, which do not use specified lists of
 * values and, thus, need no templates.
 */

import type {QuestionCategory} from '../questionCategory';
import {Question, type SimpleQuestionType, type QuestionData} from './question';

/**
 * The data format for SimpleQuestions
 */
export interface SimpleQuestionData extends QuestionData {
  type: SimpleQuestionType;
}

export function isSimpleQuestionData(data: QuestionData): data is SimpleQuestionData {
  return 'type' in data;
}

/**
 * A question. It must be contained within one and only one QuestionCategory.
 */
export class SimpleQuestion extends Question {
  constructor(public data: SimpleQuestionData, public parent: QuestionCategory) {
    super(data, parent);
  }

  get type() {
    return this.data.type;
  }
}
