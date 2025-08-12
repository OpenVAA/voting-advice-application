import type {
  AnyEntityVariant,
  AnyQuestionVariant,
  Choice,
  MultipleChoiceCategoricalQuestion,
  SingleChoiceCategoricalQuestion,
  SingleChoiceOrdinalQuestion
} from '@openvaa/data';
import type { EntityAnswerContext, EntitySummaryContext } from '../types/entityContext';

type AnyChoiceQuestion =
  | SingleChoiceOrdinalQuestion
  | SingleChoiceCategoricalQuestion
  | MultipleChoiceCategoricalQuestion;

function isChoiceQuestion(question: AnyQuestionVariant): question is AnyChoiceQuestion {
  return 'choices' in question && 'getChoice' in question;
}

/**
 * Creates rich context for LLM prompts from entity data, questions, and categories.
 */
export function createEntityContext(
  entity: AnyEntityVariant,
  questions: Array<AnyQuestionVariant>,
  options: CreateEntityContextOptions = {}
): EntityContext {
  const { onlyWithComments = false, includeRejectedChoices = false } = options;

  const answeredQuestions: Array<EntityAnswerContext> = [];

  for (const question of questions) {
    const answer = entity.getAnswer(question);
    if (!answer || answer.value == null) continue;

    // Ensure answer.value is a string
    if (typeof answer.value !== 'string') {
      answer.value = String(answer.value);
    }

    // If we only want to include questions with comments, skip questions without a comment
    if (onlyWithComments && !answer.info) continue;

    // Try to get the formatted value and fallback to the raw value
    let formattedValue: string | number | boolean | null = null;
    try {
      formattedValue = entity.getFormattedAnswer({ question });
    } catch (error) {
      if (question.text === 'Party') {
        console.info('Skipping party affiliation question due to formatting error');
        continue;
      } else {
        console.error(`Error formatting answer for question ${question}:`, error);
        formattedValue = answer.value as string | number | boolean | null;
      }
    }

    let choiceDetails: EntityAnswerContext['answer']['choiceDetails'];
    if (isChoiceQuestion(question)) {
      const acceptedChoices: Array<Choice> = [];
      const rejectedChoices: Array<Choice> = [];

      if (typeof answer.value === 'string') {
        const choice = question.getChoice(answer.value);
        if (choice) {
          acceptedChoices.push(choice as Choice);
        }
      } else if (Array.isArray(answer.value)) {
        // Handle multiple choice questions
        for (const value of answer.value as Array<string>) {
          // Explicitly cast to Array<string>
          if (typeof value === 'string') {
            const choice = question.getChoice(value);
            if (choice) {
              acceptedChoices.push(choice as Choice);
            }
          }
        }
      }

      // If includeRejectedChoices is enabled, add all non-selected choices to rejectedChoices
      if (includeRejectedChoices && 'choices' in question) {
        const selectedValues = Array.isArray(answer.value) ? answer.value : [answer.value];
        for (const choice of question.choices) {
          if (!selectedValues.includes(choice.id)) {
            rejectedChoices.push(choice as Choice);
          }
        }
      }

      if (acceptedChoices.length > 0 || rejectedChoices.length > 0) {
        choiceDetails = {
          acceptedChoices,
          rejectedChoices
        };
      }
    }

    const answerContext: EntityAnswerContext = {
      entity: {
        id: entity.id,
        name: entity.name,
        type: entity.type
      },
      question: {
        id: question.id,
        text: question.name,
        type: question.type,
        category: {
          name: question.category.name,
          description: question.category.info
        }
      },
      answer: {
        rawValue: answer.value as string | number | boolean | null,
        formattedValue: formattedValue as string,
        comment: answer.info ?? undefined,
        choiceDetails
      }
    };

    answeredQuestions.push(answerContext);
  }

  return {
    entity: {
      id: entity.id,
      name: entity.name,
      type: entity.type
    },
    answeredQuestions,
    stats: {
      totalQuestions: questions.length,
      answeredQuestions: answeredQuestions.length,
      questionsWithComments: answeredQuestions.filter((aq) => aq.answer.comment).length
    }
  };
}

/**
 * Formats a specific variable for use in prompts based on the variable type
 * @param variableType - The type of variable to format
 * @param context - The entity summary context
 * @param options - Options for formatting
 * @returns The formatted string for the specific variable
 */
export function formatVariableForPrompt(
  variableType: SummarizerVariable,
  context: EntitySummaryContext,
  options: CreateEntitySummaryOptions = {}
): string {
  switch (variableType) {
    case SummarizerVariableEnum.entityType:
      return context.entity.type;

    case SummarizerVariableEnum.questionsAndAnswers:
      return formatQuestionsAndAnswers(context, options);

    default:
      throw new Error(`Unknown variable type: ${variableType}`);
  }
}

/**
 * Formats the questions and answers variable
 */
function formatQuestionsAndAnswers(context: EntitySummaryContext, options: CreateEntitySummaryOptions = {}): string {
  const { answeredQuestions } = context;
  const { includeRejectedChoices = false } = options;

  let qAndAs = '';

  for (const aq of answeredQuestions) {
    qAndAs += `Category: ${aq.question.category.name}\n`;
    qAndAs += `Question: "${aq.question.text}"\n`;
    qAndAs += `Answer: ${aq.answer.formattedValue}`;

    if (aq.answer.choiceDetails) {
      const { acceptedChoices, rejectedChoices } = aq.answer.choiceDetails;

      if (acceptedChoices.length > 1) {
        // Multiple choices selected
        const choiceLabels = acceptedChoices.map((c) => c.label).join(', ');
        qAndAs += ` (Selected: ${choiceLabels})`;
      }

      if (includeRejectedChoices && rejectedChoices.length > 0) {
        const rejectedLabels = rejectedChoices.map((c) => c.label).join(', ');
        qAndAs += `\nNot selected: ${rejectedLabels}`;
      }
    }

    if (aq.answer.comment) {
      qAndAs += `\nComment: "${aq.answer.comment}"`;
    }

    qAndAs += '\n\n';
  }

  return qAndAs;
}

/**
 * Creates all variables needed for the prompt from the context
 * @param context - The entity summary context
 * @param options - Options for formatting
 * @returns Record of all variables with their formatted values
 */
export function createPromptVariables(
  context: EntitySummaryContext,
  options: CreateEntitySummaryOptions = {}
): Record<string, string> {
  return {
    [SummarizerVariableEnum.entityType]: formatVariableForPrompt(SummarizerVariableEnum.entityType, context, options),
    [SummarizerVariableEnum.questionsAndAnswers]: formatVariableForPrompt(
      SummarizerVariableEnum.questionsAndAnswers,
      context,
      options
    )
  };
}
