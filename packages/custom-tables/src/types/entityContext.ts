import type { Id } from '@openvaa/core';
import type { Choice, EntityType, QuestionType } from '@openvaa/data';

/**
 * Rich context for an entity's answer to a specific question
 */
export interface EntityAnswerContext {
  /** The entity that answered */
  entity: {
    id: Id;
    name: string;
    type: EntityType;
  };
  /** The question that was answered */
  question: {
    id: Id;
    text: string;
    type: QuestionType;
    category: {
      name: string;
      description: string;
    };
  };
  /** The answer details */
  answer: {
    /** Raw answer value */
    rawValue: string | number | boolean | null; // TODO: is there a native type for this? i'd guess so
    /** Human-readable formatted answer */
    formattedValue: string; // Is this always a string?
    /** Optional comment/explanation */
    comment?: string;
    /** For choice questions, the selected choice details */
    choiceDetails?: {
      acceptedChoices: Array<Choice>;
      rejectedChoices: Array<Choice>;
    };
  };
}

/**
 * Complete context for an entity across all their answers
 */
export interface EntityContext {
  /** Entity information */
  entity: {
    id: Id;
    name: string;
    type: EntityType;
  };
  /** All answered questions with context */
  answeredQuestions: Array<EntityAnswerContext>;
  /** Summary statistics */
  stats: {
    totalQuestions: number;
    answeredQuestions: number;
    questionsWithComments: number;
  };
}