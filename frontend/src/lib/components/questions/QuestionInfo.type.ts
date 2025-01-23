import type { ExpanderProps } from '$lib/components/expander';

export type QuestionInfoProps = Partial<ExpanderProps> & {
  title: string;
  /**
   * The info content to show as a plain or HTML string.
   */
  info: string;

  /**
   * The background info of the question.
   */
  background?: string;

  /**
   * The arguments for the question.
   */
  argumentsFor?: string;

  /**
   * The arguments against the question.
   */
  argumentsAgainst?: string;

  /**
   * The current situation of the question.
   */
  currentSituation?: string;

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
};
