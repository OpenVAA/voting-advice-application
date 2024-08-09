import type { SvelteHTMLElements } from 'svelte/elements';
import type { ScoreGaugeProps } from '$lib/components/scoreGauge';

export type SubMatchesProps = SvelteHTMLElements['div'] & {
  /**
   * The sub-matches of a `RankingProps`.
   */
  matches: Array<SubMatchProps>;
  /**
   * Variant layout, controlling the spacing of gauges. @default 'tight'
   */
  variant?: 'tight' | 'loose';
  /**
   * Optional properties passed to `ScoreGauge`.
   */
  scoreGaugeProps?: Partial<Omit<ScoreGaugeProps, 'score'>>;
};
