import { staticSettings } from '@openvaa/app-shared';
import { adjustContrast } from './adjustContrast';
import type { Colors } from '@openvaa/data';

const bg = staticSettings.colors?.light?.['base-300'] ?? 'd1ebee';
const bgDark = staticSettings.colors?.dark?.['base-300'] ?? '1f2324';

/**
 * Tries to ensure that `color` and `colorDark` have a sufficient contrast ratio on their respective backgrounds. If `colorDark` is `undefined`, it will be constructed from `color`, if available. In case either color cannot be constructed, an empty string is returned for it.
 * @param color The light theme color
 * @param colorDark The dark theme color
 * @returns An object with the adjusted colors
 */
export function ensureColors({ normal, dark }: Partial<Colors>): WithRequired<Colors, 'dark'> {
  if (normal) {
    normal = adjustContrast(normal, bg) ?? normal;
  } else {
    normal = '';
  }
  if (dark) {
    dark = adjustContrast(dark, bgDark) ?? dark;
  } else if (normal) {
    dark = adjustContrast(normal, bgDark) ?? '';
  } else {
    dark = '';
  }
  return { normal, dark };
}
