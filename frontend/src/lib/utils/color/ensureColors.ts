import settings from '$lib/config/settings.json';
import { adjustContrast } from './adjustContrast';

const bg = settings.colors?.light?.['base-300'] ?? 'd1ebee';
const bgDark = settings.colors?.dark?.['base-300'] ?? '1f2324';

/**
 * Tries to ensure that `color` and `colorDark` have a sufficient contrast ratio on their respective backgrounds. If `colorDark` is `undefined`, it will be constructed from `color`, if available. In case either color cannot be constructed, an empty string is returned for it.
 * @param color The light theme color
 * @param colorDark The dark theme color
 * @returns An object with the adjusted colors
 */
export function ensureColors(
  color?: string,
  colorDark?: string
): { color: string; colorDark: string } {
  if (color) {
    color = adjustContrast(color, bg) ?? color;
  } else {
    color = '';
  }
  if (colorDark) {
    colorDark = adjustContrast(colorDark, bgDark) ?? colorDark;
  } else if (color) {
    colorDark = adjustContrast(color, bgDark) ?? '';
  } else {
    colorDark = '';
  }
  return { color, colorDark };
}
