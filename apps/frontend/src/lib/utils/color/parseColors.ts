import type { Colors } from '@openvaa/data';

/**
 * Parse a colors string, `Colors` object or `null` into a `Colors` object.
 * @param colors - The defined or missing colors
 * @param defaultColor - The default color to use if colors is missing
 * @returns A `Colors` object with the parsed colors, or the default color as `normal` if none were provided.
 */
export function parseColors(colors: Colors | string | null | undefined, defaultColor: string): Colors {
  // colors may be a Colors object or string
  const normal = colors ? (typeof colors === 'string' ? colors : colors.normal) : defaultColor;
  const dark = colors && typeof colors === 'object' ? colors.dark : undefined;
  return {
    normal,
    dark
  };
}
