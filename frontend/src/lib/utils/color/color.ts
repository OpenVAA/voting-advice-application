// Provides utilities for ensuring color contrasts for accessibility purposes

import {logDebugError} from '../logger';

/** An RGB color array. The numbers' domain is [0, 255] */
export type RGB = [number, number, number];

/** Luminance factors for rgb channels */
const LUM_F = [0.2126, 0.7152, 0.0722];

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
  const {contrast, colorL, bgL} = calcContrast(color, bgColor);
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
  return {contrast, colorL, bgL};
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

/**
 * Converts an RGB color value to hex.
 * @param rgb The RGB color value to convert.
 * @returns The hex color string.
 */
export function rgbToHex(rgb: RGB): string {
  return '#' + ((1 << 24) + (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]).toString(16).slice(1);
}

/**
 * Calculates the luminance of an RGB color array.
 * @param color The color to calculate the luminance of.
 * @returns The luminance of the color.
 */
export function luminance(color: RGB) {
  return color.reduce((acc, v, i) => acc + valueToLum(v) * LUM_F[i], 0);
}

/**
 * Calculates the partial luminance of an RGB color channel value.
 * @param v The channel value
 * @returns The partial luminance of the value
 */
function valueToLum(v: number): number {
  v = Math.min(Math.max(v, 0), 255);
  v /= 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/**
 * Set the luminance of a color to a target maintaining its hue. This works by iteratively shifting the color either towards white or black, bc of difficulty of an analytical solution.
 * @param color The RGB color array to adjust
 * @param lum The target luminance (between 0 and 1)
 * @param eps The difference to target luminance to accept. @default 1e-3
 * @param maxSteps The maximum number of steps to take. @default 50
 * @param stepFactor The factor by which to increase or decrease the step size. @default 0.91
 * @returns The adjusted color
 */
export function setLuminance(
  color: RGB,
  lum: number,
  eps = 1e-3,
  maxSteps = 50,
  stepFactor = 0.91
) {
  lum = Math.min(Math.max(lum, 0), 1);
  let diff = lum - luminance(color);
  // The direction of adjustment
  const sign = diff > 0 ? 1 : -1;
  // The max adjustment i.e. diff between color and white or black
  const adj = [0, 1, 2].map((i) => (sign > 0 ? 255 - color[i] : -color[i]));
  let f = Math.abs(diff);
  let s = f * stepFactor;
  let i = 0;
  let curr: RGB = [...color];
  while (i < maxSteps && Math.abs(diff) > eps) {
    curr = color.map((v, i) => v + adj[i] * f) as RGB;
    diff = lum - luminance(curr);
    // Set the sign of step depending on which side of the target we are
    s = Math.abs(s);
    if (diff * sign < 0) s *= -1;
    // Make step smaller
    s *= stepFactor;
    // Add step to factor and clamp
    f = Math.min(Math.max(f + s, 0), 1);
    i++;
  }
  return curr.map((v) => Math.round(v)) as RGB;
}
