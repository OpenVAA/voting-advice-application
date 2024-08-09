import { logDebugError } from '../logger';
import type { RGB } from './rgb';

/**
 * Parses a color string and returns an RGB array.
 * @param color The color string to parse in any of the formats: '000', '000000', '#000', '#000000', 'rgb(0,0,0)',
 * @returns An RGB array, or `undefined` if the color string is not valid.
 */

export function parseColor(color: string): RGB | undefined {
  color = color.replace(/\s+/g, '');
  // If it's an RGB string, parse it
  if (color.startsWith('rgb(') && color.endsWith(')')) {
    const rgbValues = color.substring(4, color.length - 1).split(',');
    if (rgbValues.length !== 3) {
      logDebugError('Invalid RGB color format. Please provide three comma-separated values.');
      return undefined;
    }
    const out = rgbValues.map((v) => parseInt(v, 10));
    if (out.find((v) => isNaN(v))) {
      logDebugError('Invalid RGB color format. RGB values must be integers.');
      return undefined;
    }
    return out as RGB;
  }
  // Remove '#' if present
  if (color.startsWith('#')) color = color.slice(1);
  if (!color.match(/^(?:[0-9a-f]{3}|[0-9a-f]{6})$/i)) {
    logDebugError(`Invalid color format (${color}). Please use hex format or RGB format.`);
    return undefined;
  }
  // Short hex
  if (color.length === 3)
    color = color
      .split('')
      .map((char) => char + char)
      .join('');
  // Convert to RGB
  const bigint = parseInt(color, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return [r, g, b];
}
