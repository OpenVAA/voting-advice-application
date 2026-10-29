import type { SelectProps } from '$lib/components/select/Select.type';

export type LanguageSelectorProps = Omit<SelectProps, 'options'> & {
  /**
   * The name of the form element. @default 'language'
   */
  name?: string;
};
