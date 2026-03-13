import type { AnyChoice, DataObjectData, QuestionType } from '../../../internal';

/**
 * Data for a `QuestionTemplate`, which defines shared default properties and configuration
 * for creating questions (e.g., a "5-point Likert Scale" template whose choices are reused
 * across many opinion questions).
 */
export interface QuestionTemplateData extends DataObjectData {
  /**
   * The question type this template defines defaults for (e.g., 'singleChoiceOrdinal', 'text').
   */
  type: QuestionType;
  /**
   * Type-specific configuration for the template. @defaultValue {}
   */
  settings?: Record<string, unknown> | null;
  /**
   * Default choices for choice-type templates (e.g., Likert scale labels). @defaultValue []
   */
  defaultChoices?: Array<AnyChoice> | null;
}
