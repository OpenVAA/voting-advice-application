import type { AnyQuestionVariant } from '@openvaa/data';
import type { QuestionInfoSection } from '@openvaa/app-shared';

export type QuestionExtendedInfoDrawerProps = {
  /**
   * The question to extract info from
   */
  question: AnyQuestionVariant;
  
  /**
   * Additional custom info sections to show
   */
  customSections?: Array<QuestionInfoSection>;
};
