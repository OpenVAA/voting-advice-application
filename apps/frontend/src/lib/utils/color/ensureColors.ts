import { staticSettings } from '@openvaa/app-shared';
import { adjustContrast } from './adjustContrast';
import type { Colors } from '@openvaa/data';

const bg = staticSettings.colors?.light?.['base-300'] ?? 'd1ebee';
const bgDark = staticSettings.colors?.dark?.['base-300'] ?? '1f2324';

/** What a returned colour is: `#` and six lowercase hexadecimal digits. */
const HEX_COLOR = /^#[0-9a-f]{6}$/;

/**
 * Ensure that a colour pair has a sufficient contrast ratio on the background of each theme, and that nothing but a colour is returned. Each member is parsed and adjusted, and a member that is absent or cannot be parsed counts as absent: the normal colour is then the empty string, and the dark colour is constructed from the normal one, or is the empty string when there is none. A returned member is therefore a hex colour or the empty string and never the text that was passed in, so it is safe to write into a `style` attribute.
 * @param normal - The light theme color
 * @param dark - The dark theme color
 * @returns An object with the adjusted colors
 */
export function ensureColors({ normal, dark }: Partial<Colors>): WithRequired<Colors, 'dark'> {
  const ensuredNormal = adjustedOrNothing(normal, bg);
  return {
    normal: ensuredNormal,
    dark: adjustedOrNothing(dark, bgDark) || adjustedOrNothing(ensuredNormal, bgDark)
  };
}

/**
 * A colour adjusted for contrast on a background.
 * @param color - The colour as stored, of whatever type the stored value turned out to have.
 * @param background - The background the colour is shown on.
 * @returns The adjusted colour as a hex colour, or the empty string when the value is not a colour the parser reads.
 */
function adjustedOrNothing(color: unknown, background: string): string {
  if (typeof color !== 'string' || color === '') return '';
  const adjusted = adjustContrast(color, background);
  return adjusted !== undefined && HEX_COLOR.test(adjusted) ? adjusted : '';
}
