import type { I18nContext } from '../i18n';

export type ComponentContext = I18nContext & {
  /** True if dark mode is preferred. */
  darkMode: boolean;
};
