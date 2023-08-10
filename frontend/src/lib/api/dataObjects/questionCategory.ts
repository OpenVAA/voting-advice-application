/*
 * Contains both the data type and the final object class for a
 * question category.
 *
 * TO DO: Maybe add constituencyCategoryId as a filter as well
 */

import type {HasId, Id, RichText} from '../dataProvider.types';
import {Question} from './question';
import type {QuestionData} from './question';

export interface QuestionCategoryData extends HasId {
  name?: string;
  shortName?: string;
  order?: number;
  info?: RichText;
  questionIds?: Id[];
  constituencyId?: Id;
}

export class QuestionCategory {
  questions: Question[] = [];

  constructor(public data: QuestionCategoryData) {}

  get id() {
    return this.data.id;
  }

  get name() {
    return this.data.name ?? '';
  }

  get shortName() {
    return this.data.shortName ?? this.name;
  }

  get order() {
    return this.data.order ?? 0;
  }

  get info() {
    return this.data.info ?? '';
  }

  get questionIds() {
    return this.data.questionIds ?? [];
  }

  get constituencyId() {
    return this.data.constituencyId ?? '';
  }

  /**
   * A utility method to supply Question objects.
   *
   * TO DO: allowLess is quite hacky; rethink
   *
   * @param questionsData All availale data which are then filtered
   * @param allowLess Set true if setting effective questions which might
   * be filtered
   */
  supplyQuestionsData(questionsData: QuestionData[], allowLess = false) {
    this.questions = questionsData
      .filter((q) => this.questionIds.includes(q.id))
      .map((q) => new Question(q, this));
    if (!allowLess && this.questions.length !== this.questionIds.length) {
      throw new Error(
        `Not enough Questions supplied: ${this.questions.length} of ${this.questionIds.length}.`
      );
    }
  }

  // Here we will define more methods that can be used in the frontend.
}
