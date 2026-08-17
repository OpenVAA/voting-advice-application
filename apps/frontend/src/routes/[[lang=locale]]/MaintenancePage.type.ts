import type { SvelteHTMLElements } from 'svelte/elements';

export type MaintenancePageProps = SvelteHTMLElements['main'] & {
  /**
   * The maintenance page title. @default $t('maintenance.title')
   */
  title?: string;
  /**
   * The maintenance page content. @default $t('dynamic.maintenance.content')
   */
  content?: string;
  /**
   * The hero emoji to display. @default $t('dynamic.maintenance.heroEmoji')
   */
  emoji?: string;
};
