import type { Snippet } from 'svelte';

export type NothingToEditProps = {
  /**
   * The page title. @default t('contestantApp.nothingToEdit.title')
   */
  title?: string;
  /**
   * Replaces the default explanation, e.g. to give another reason the user has nothing to edit.
   */
  children?: Snippet;
};
