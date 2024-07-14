// Provides utilities for ensuring color contrasts for accessibility purposes

import { setLuminance, luminance } from './luminance';
import { parseColor } from './parseColor';
import type { RGB } from './rgb';
import { rgbToHex } from './rgbToHex';

/** Added to luminances when calculating the contrast */
const CONTRAST_EPS = 0.05;

export function adjustContrast(color: RGB, bgColor: RGB, minContrast?: number): string;
export function adjustContrast(
  color: string,
  bgColor: string,
  minContrast?: number
): string | undefined;
/** Adjust the luminance of `color` so that it reaches `minContrast` on `bgColor`. It's best to set the contrast a bit higher than desired because the process is not analytical.
 * @param color The foreground color as either an RGB array or a hex string.
 * @param bgColor The background color as either an RGB array or a hex string.
 * @param minContrast The minimum contrast. @default 4.55
 * @returns The adjusted foreground color as hex string.
 */
export function adjustContrast(
  color: RGB | string,
  bgColor: RGB | string,
  minContrast = 4.55
): string | undefined {
  if (typeof color === 'string') {
    const res = parseColor(color);
    if (!res) return undefined;
    color = res;
  }
  if (typeof bgColor === 'string') {
    const res = parseColor(bgColor);
    if (!res) return undefined;
    bgColor = res;
  }
  const { contrast, colorL, bgL } = calcContrast(color, bgColor);
  if (contrast < minContrast) {
    // Select the direction of luminance adjustment primarily based on which color is lighter
    const bgDarker = colorL > bgL;
    let targetL = calcTargetLuminance(colorL, bgL, minContrast, bgDarker);
    // But check also if target contrast can be reached in that direction, and reverse it otherwise
    if (targetL < 0 || targetL > 1)
      targetL = calcTargetLuminance(colorL, bgL, minContrast, !bgDarker);
    color = setLuminance(color, targetL);
  }
  // If the contrast ratio already meets the AA criterion, return the original color
  return rgbToHex(color);
}

/**
 * Calculates the contrast between two colors
 * @param color The foreground color.
 * @param bgColor The background color.
 * @returns An object containing the contrast ratio, the luminance of the color, and the luminance of the background color.
 */
export function calcContrast(color: RGB, bgColor: RGB) {
  const colorL = luminance(color);
  const bgL = luminance(bgColor);
  const contrast =
    colorL > bgL
      ? (colorL + CONTRAST_EPS) / (bgL + CONTRAST_EPS)
      : (bgL + CONTRAST_EPS) / (colorL + CONTRAST_EPS);
  return { contrast, colorL, bgL };
}

/**
 * Calculates the target luminance for the foreground color.
 * @param colorL The luminance of the foreground color
 * @param bgL The luminance of the background color
 * @param minContrast The minimum contrast
 * @param bgDarker Whether the background color should be darker than the foreground color. @default true
 * @returns The target luminance of the color
 */
function calcTargetLuminance(colorL: number, bgL: number, minContrast: number, bgDarker = true) {
  return bgDarker
    ? (bgL + CONTRAST_EPS) * minContrast - CONTRAST_EPS
    : (bgL + CONTRAST_EPS) / minContrast - CONTRAST_EPS;
}
