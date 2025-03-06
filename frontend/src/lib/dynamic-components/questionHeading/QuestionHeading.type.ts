import type { AnyQuestionVariant } from '@openvaa/data';
import type { HeadingGroupProps } from '$lib/components/headingGroup';
import type { QuestionBlocks } from '$lib/contexts/utils/questionBlockStore.type';

export type QuestionHeadingProps = HeadingGroupProps & {
  /**
   * The `Question` whose text and metadata to show.
   */
  question: AnyQuestionVariant;
  /**
   * The `QuestionBlocks` containing the question.
   */
  questionBlocks?: QuestionBlocks;
  /**
   * Set to `true` if using the component on a dark (`base-300`) background. @default false
   */
  onShadedBg?: boolean;
};
