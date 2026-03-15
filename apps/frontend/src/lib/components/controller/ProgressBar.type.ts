import type { SvelteHTMLElements } from 'svelte/elements';

export type ProgressBarProps = SvelteHTMLElements['div'] & {
  /**
   * Progress value between 0 and 1.
   */
  progress: number;
  /**
   * Label for the progress bar. @default t('adminApp.jobs.progress')
   */
  label?: string;
  /**
   * Whether to show the percentage. @default true
   */
  showPercentage?: boolean;
  /**
   * Color theme for the progress bar. @default 'primary'
   */
  color?: 'primary' | 'secondary' | 'accent';
  /**
   * Size of the progress bar. @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';
};
