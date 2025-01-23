import type { ExpanderProps } from '$lib/components/expander';

export type QuestionInfoProps = Partial<ExpanderProps> & {
  title: string;
  /**
   * The info content to show as a plain or HTML string.
   */
  info: string;
  /**
   * Additional expandable info sections shown as plain or HTML strings.
   */
  infoSections?: Array<{
    title: string;
    content: string;
  }>;
  /**
   * The future situation of the question.
   */
  terms?: string;
  /**
   * A callback triggered when the info content is collapsed. Mostly used for tracking.
   */
  onCollapse?: () => void;
  /**
   * A callback triggered when the info content is expanded.  Mostly used for tracking.
   */
  onExpand?: () => void;
  /**
   * The ID of the question.
   */
  questionId: string;
};
