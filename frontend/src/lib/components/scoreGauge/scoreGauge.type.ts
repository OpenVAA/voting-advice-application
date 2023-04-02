import type {HTMLProgressAttributes} from 'svelte/elements';
export interface ScoreGaugeProps extends HTMLProgressAttributes {
  score: number;
  label?: string;
  shape?: 'linear' | 'radial';
  showUnit?: boolean;
  unit?: string;
  labelColor?: string;
  meterColor?: string;
}
