import type { AnyQuestionVariant } from '@openvaa/data';
import type { SvelteHTMLElements } from 'svelte/elements';

export type QuestionExtendedInfoProps = SvelteHTMLElements['div'] & {
  /**
   * The question to show the info for.
   */
  question: AnyQuestionVariant;
  /**
   * Optional title for the info, by default the question text.
   */
  title?: string;
  /**
   * A callback triggered when an info section is collapsed. Mostly used for tracking.
   */
  onSectionCollapse?: (title: string) => void;
  /**
   * A callback triggered when an info section is expanded.  Mostly used for tracking.
   */
  onSectionExpand?: (title: string) => void;
};
