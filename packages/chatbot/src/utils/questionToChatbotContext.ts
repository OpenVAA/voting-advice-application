import type { AnyQuestionVariant } from '@openvaa/data';
import type { ChatbotQuestionContext } from '../controller/chatbotController.type';

export function questionToChatbotContext(question: AnyQuestionVariant): ChatbotQuestionContext {
  const category = question.category;

  return {
    questionId: String(question.id),
    type: question.type,
    text: question.text,
    category: category
      ? {
          id: String(category.id),
          name: category.name
        }
      : undefined
  };
}
