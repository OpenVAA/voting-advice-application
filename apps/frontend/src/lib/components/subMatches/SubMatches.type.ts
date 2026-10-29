import type { QuestionCategory } from '@openvaa/data';
import type { SubMatch } from '@openvaa/matching';
import type { SvelteHTMLElements } from 'svelte/elements';
import type { ScoreGaugeProps } from '$lib/components/scoreGauge';

export type SubMatchesProps = SvelteHTMLElements['div'] & {
  /**
   * The `SubMatch`es of a `Match`.
   */
  matches: Array<SubMatch<QuestionCategory>>;
  /**
   * Variant layout, controlling the spacing of gauges. @default 'tight'
   */
  variant?: 'tight' | 'loose';
  /**
   * Optional properties passed to `ScoreGauge`.
   */
  scoreGaugeProps?: Partial<Omit<ScoreGaugeProps, 'score'>>;
};
