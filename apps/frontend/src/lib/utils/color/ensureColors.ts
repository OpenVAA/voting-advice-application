import { staticSettings } from '@openvaa/app-shared';
import { adjustContrast } from './adjustContrast';
import type { Colors } from '@openvaa/data';

const bg = staticSettings.colors?.light?.['base-300'] ?? 'd1ebee';
const bgDark = staticSettings.colors?.dark?.['base-300'] ?? '1f2324';

/**
 * Ensure that a colour pair has a sufficient contrast ratio on the background of each theme, and that nothing but a colour is returned. Each member is parsed and adjusted, and a member that is absent or cannot be parsed counts as absent: the normal colour is then the empty string, and the dark colour is constructed from the normal one, or is the empty string when there is none. A returned member is therefore a hex colour or the empty string and never the text that was passed in, so it is safe to write into a `style` attribute.
 * @param normal - The light theme color
 * @param dark - The dark theme color
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
