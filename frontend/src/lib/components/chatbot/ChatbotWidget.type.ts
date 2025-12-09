
import type { ChatbotQuestionContext } from '@openvaa/chatbot'

export interface ChatbotWidgetProps {
  /**
   * Whether the widget is currently visible @default false
   */
  isOpen?: boolean;
  /**
   * Optional question context to provide to the chatbot.
   * TODO: add more context, so other pages can provide context as well. @default undefined
   */
  questionContext?: ChatbotQuestionContext;
  /**
   * The locale for the chatbot
   */
  locale: string;
  /**
   * Callback for when the close button is clicked
   */
  onClose?: () => void;
}
