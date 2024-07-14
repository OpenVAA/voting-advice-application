import type { RGB } from './rgb';

/** Luminance factors for rgb channels */
export const LUM_F = [0.2126, 0.7152, 0.0722];

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
  eps = 0.001,
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
