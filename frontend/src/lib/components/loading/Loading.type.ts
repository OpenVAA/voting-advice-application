import type {SvelteHTMLElements} from 'svelte/elements';
export type LoadingProps = SvelteHTMLElements['div'] & {
  /**
   * Whether to show an inline version of the spinner. By default the spinner tries to center itself in the available area. @default false
   */
  inline?: boolean;
  /**
   * The label text. @default $t('common.loading')
   */
  label?: string;
  /**
   * Whether to show the text label. The label will always be shown to screen readers. @default false
   */
  showLabel?: boolean;
  /**
   * The size of the loading spinner. @default 'lg'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg';
};
