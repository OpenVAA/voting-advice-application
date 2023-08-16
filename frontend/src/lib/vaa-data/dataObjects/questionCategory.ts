/*
 * The class for question categories.
 *
 * TO DO: Maybe add constituencyCategoryId as a filter as well
 */

import type {Id, RichText} from '../data.types';
import {NamedDataObject} from './namedDataObject';
import type {NamedDataObjectData} from './namedDataObject';
import {DataObjectCollection} from './dataObjectCollection';
import type {DataRoot} from './dataRoot';
import {
  LikertQuestion,
  Question,
  QuestionType,
  SimpleQuestion,
  isSimpleQuestionData,
  isTemplateQuestionData
} from './questions';
import type {QuestionData, SimpleQuestionData} from './questions';
import type {FilterValue} from '../filter';

export interface QuestionCategoryData extends NamedDataObjectData {
  info?: RichText;
  questionIds?: Id[];
  constituencyId?: FilterValue<Id>;
}

/**
 * A collection of questions. All Questions are contained within
 * one and only one QuestionCategory.
 */
export class QuestionCategory extends NamedDataObject {
  questions = new DataObjectCollection<Question>([]);

  constructor(public data: QuestionCategoryData, public parent: DataRoot) {
    super(data, parent);
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
   * A utility method to provide Question objects.
   *
   * TO DO: Remove this and provide QuestionData as part of constructor
   * data the same way as in ConstituencyCategory.
   *
   * TO DO: At least move the question creation logic somewhere more
   * appropriate.
   *
   * @param questionData All availale data which are then filtered
   */
  provideQuestionData(questionData: QuestionData[]) {
    this.questions.extend(
      questionData
        .filter((d) => this.questionIds.includes(d.id))
        .map((d) => {
          if (isSimpleQuestionData(d)) {
            // First check simple types
            if (d.type === QuestionType.Text) {
              return new SimpleQuestion(d as SimpleQuestionData, this);
            }
          }
          // Then check template ones
          // There must be a template
          if (isTemplateQuestionData(d)) {
            const template = this.root.questionTemplates.byId(d.templateId);
            if (!template) {
              throw new Error(`QuestionTemplate with id ${d.templateId} not found`);
            }
            // Create the question based on type
            if (template.type === QuestionType.Likert) {
              return new LikertQuestion(d, this, template);
            }
          }
          throw new Error(`Invalid QuestionData for Question with id: ${d.id}`);
        })
    );
    if (this.questions.length !== this.questionIds.length) {
      throw new Error(
        `Not enough Questions supplied: ${this.questions.length} of ${this.questionIds.length}.`
      );
    }
  }
}
