import type { ButtonProps } from '$lib/components/button';

export type SurveyButtonProps = Partial<ButtonProps> & {
  /**
   * Bindable: whether the button has been clicked. @default false
   */
  readonly clicked?: boolean;
};
