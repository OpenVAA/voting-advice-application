import type { QuestionInCardContent } from '@openvaa/app-shared';
import type { AnyQuestionVariant, DataRoot } from '@openvaa/data';
import type { InfoAnswerProps } from '$lib/components/infoAnswer';

/**
 * Retrieves the questions to be shown in the card based on the given entity type.
 * @param type - The type of entity (candidate or organization) for which to retrieve the questions.
 * @param appSettings - The app settings
 * @param dataRoot - The data root
 * @returns An array of question definitions for use in `EntityCard`.
 */
export function getCardQuestions({
  type,
  appSettings,
  dataRoot
}: {
  type: 'candidate' | 'organization';
  appSettings: AppSettings;
  dataRoot: DataRoot;
}): Array<{
  question: AnyQuestionVariant;
  hideLabel?: boolean;
  format?: InfoAnswerProps['format'];
}> {
  const questions = appSettings.results.cardContents[type].filter(isQuestion).map((q) => {
    const { question: id, ...rest } = q as QuestionInCardContent;
    const question = dataRoot.getQuestion(id);
    return {
      question,
      ...rest
    };
  });
  return questions;
}

function isQuestion(value: unknown): value is QuestionInCardContent {
  return typeof value === 'object' && value !== null && 'question' in value && typeof value.question === 'string';
}
