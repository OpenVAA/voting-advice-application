import type { SelectProps } from '$lib/components/select/Select.type';

export type LanguageSelectorProps = SelectProps & {
  /**
   * The name of the form element. @default 'language'
   */
  name?: string;
};
