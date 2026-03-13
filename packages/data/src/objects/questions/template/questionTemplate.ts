import { DataObject, OBJECT_TYPE } from '../../../internal';
import type { AnyChoice, DataRoot, QuestionTemplateData, QuestionType } from '../../../internal';

/**
 * A template that defines default properties, answer type, and configuration for creating
 * questions. For example, a "5-point Likert Scale" template defines the choices and settings
 * that are reused across many opinion questions.
 *
 * This corresponds to the `question_templates` database table and replaces Strapi's
 * `QuestionType` concept.
 */
export class QuestionTemplate extends DataObject<QuestionTemplateData> {
  readonly objectType = OBJECT_TYPE.QuestionTemplate;

  constructor({ data, root }: { data: QuestionTemplateData; root: DataRoot }) {
    super({ data, root });
  }

  /**
   * The question type this template defines defaults for.
   */
  get type(): QuestionType {
    return this.data.type;
  }

  /**
   * Type-specific configuration for the template. @defaultValue {}
   */
  get settings(): Record<string, unknown> {
    return this.data.settings ?? {};
  }

  /**
   * Default choices for choice-type templates. @defaultValue []
   */
  get defaultChoices(): Array<AnyChoice> {
    return this.data.defaultChoices ?? [];
  }
}
