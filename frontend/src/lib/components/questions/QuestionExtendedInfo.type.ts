import type { QuestionInfoSection } from '@openvaa/app-shared';
import type { SvelteHTMLElements } from 'svelte/elements';

export type QuestionExtendedInfoProps = SvelteHTMLElements['div'] & {
  /**
   * The title for the info, usually the question text.
   */
  title: string;
  /**
   * The info content to show as a plain or HTML string.
   */
  info: string;
  /**
   * Additional expandable info sections shown as plain or HTML strings.
   */
  infoSections?: Array<QuestionInfoSection>;
  /**
   * A callback triggered when an info section is collapsed. Mostly used for tracking.
   */
  onSectionCollapse?: (title: string) => void;
  /**
   * A callback triggered when an info section is expanded.  Mostly used for tracking.
   */
  onSectionExpand?: (title: string) => void;
};
