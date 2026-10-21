import type { Snippet } from 'svelte';
import type { WarningProps } from '$lib/components/warning/Warning.type';

export type NotEditableNoteProps = WarningProps & {
  /**
   * Why the content cannot be edited. Selects the sentence the note shows.
   * - `'answersLocked'`: Answers can no longer be edited.
   * - `'nominationsLocked'`: Nominations can no longer be changed in the application.
   * - `'nominationsAnswersLocked'`: Nominations can no longer be changed because editing has ended in the application, while nominations themselves are not locked.
   */
  reason: 'answersLocked' | 'nominationsLocked' | 'nominationsAnswersLocked';
  /**
   * An optional second sentence rendered after the reason, e.g. that the profile is hidden because answers are missing.
   */
  children?: Snippet;
};
