import type { RGB } from './rgb';

/**
 * Converts an RGB color value to hex.
 * @param rgb The RGB color value to convert.
 * @returns The hex color string.
 */

export function rgbToHex(rgb: RGB): string {
  return '#' + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
}
