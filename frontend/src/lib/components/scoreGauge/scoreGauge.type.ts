import type {HTMLAttributes} from 'svelte/elements';
export interface ScoreGaugeProps extends HTMLAttributes<HTMLElement> {
  score: number;
  label?: string;
  shape?: 'linear' | 'radial';
  showUnit?: boolean;
  unit?: string;
  labelColor?: string;
  meterColor?: string;
}
