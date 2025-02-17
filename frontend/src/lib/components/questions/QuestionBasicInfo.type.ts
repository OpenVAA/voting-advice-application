import type { ExpanderProps } from '$lib/components/expander';

export type QuestionBasicInfoProps = Partial<ExpanderProps> & {
  /**
   * The info content to show as a plain or HTML string.
   */
  info: string;
  /**
   * A callback triggered when the info content is collapsed. Mostly used for tracking.
   */
  onCollapse?: () => void;
  /**
   * A callback triggered when the info content is expanded.  Mostly used for tracking.
   */
  onExpand?: () => void;
};
