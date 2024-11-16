import { ensureColors } from '$lib/utils/color/ensureColors';

/**
 * A temporary wrapper for the legacy API implementation.
 */
export function legacyEnsureColors(
  normal: string,
  dark?: string
): {
  color?: string;
  colorDark?: string;
} {
  const colors = ensureColors({ normal, dark });
  return {
    color: colors.normal,
    colorDark: colors.dark
  };
}
