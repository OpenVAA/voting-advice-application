import type { Colors } from '@openvaa/data';
import type { SvelteHTMLElements } from 'svelte/elements';

export type ScoreGaugeProps = Omit<SvelteHTMLElements['div'], 'color'> & {
  /**
   * The score of the gauge in the range from 0 to `max`, usually 100.
   */
  score: number;
  /**
   * The maximum value of the gauge. @default 100
   */
  max?: number;
  /**
   * The text label for the gauge, e.g. the name of the category.
   */
  label: string;
  /**
   * The format of the gauge. @default 'radial'
   */
  variant?: 'linear' | 'radial';
  /**
   * Whether to also show the score as numbers. @default true
   */
  showScore?: boolean;
  /**
   * The string to add to the score if it's shown, e.g. '%'. @default ''
   */
  unit?: string;
  /**
   * The color of the gauge. @default 'oklch(var(--n))' i.e. the `neutral` color.
   */
  color?: Colors | string | null;
};
