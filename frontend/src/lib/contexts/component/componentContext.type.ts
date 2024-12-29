import type { I18nContext } from '../i18n';
import type { darkMode } from './darkMode';

export type ComponentContext = I18nContext & {
  /**
   * A store resolving to `true` if dark mode is preferred.
   */
  darkMode: typeof darkMode;
};
