import type { ExpanderProps } from '$lib/components/expander';

export type QuestionInfoProps = Partial<ExpanderProps> & {
  /**
   * The info content to show as a plain or HTML string.
   */
  info: string;
  /**
   * Additional expandable info sections shown as plain or HTML strings.
   */
  infoSections?: Array<QuestionInfoSection>;
};
