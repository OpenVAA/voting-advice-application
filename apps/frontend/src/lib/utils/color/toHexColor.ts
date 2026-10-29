import { parseColorString } from './parseColorString';
import { rgbToHex } from './rgbToHex';

/**
 * The one form in which a colour is compared, stored and painted: `#` and six lowercase hexadecimal digits.
 */
export const HEX_COLOR = /^#[0-9a-f]{6}$/;

/**
 * Normalise a colour to {@link HEX_COLOR}, so that the letter case, the three-digit form and the leading `#` make no difference.
 *
 * It reads every form `parseColorString` reads, and a functional `rgb()` only with each channel from 0 to 255. A caller that accepts fewer forms, such as the hex field or the stored colour, checks its own form before calling.
 * @param text - A colour as written.
 * @returns The colour as lowercase `#rrggbb`, or `undefined` when `text` is no colour.
 */
export function toHexColor(text: string): string | undefined {
  const rgb = parseColorString(text);
  // `rgbToHex` carries a channel above 255 into the next one, so such a channel would yield another colour.
  if (!rgb || !rgb.every((channel) => channel >= 0 && channel <= 255)) return undefined;
  const hex = rgbToHex(rgb);
  return HEX_COLOR.test(hex) ? hex : undefined;
}
